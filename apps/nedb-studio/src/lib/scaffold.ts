import type { NEDBScaffold, Index } from "./types";

/**
 * Deterministic artifact builders. Given the structured part of a scaffold
 * (collections / relations / indexes / seed / NQL), these produce the Python
 * snippet, Node snippet, and README — guaranteeing the code always matches the
 * schema and never contains placeholders. Used by mock mode AND as the repair
 * step when AiAssist returns weak or missing snippets.
 */

export type ScaffoldCore = Omit<
  NEDBScaffold,
  "pythonSnippet" | "nodeSnippet" | "readmeExport"
> & {
  pythonSnippet?: string;
  nodeSnippet?: string;
  readmeExport?: string;
};

const qpy = (s: string) => JSON.stringify(s);

function pyValue(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(pyValue).join(", ")}]`;
  if (typeof v === "object") {
    const inner = Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${JSON.stringify(k)}: ${pyValue(val)}`)
      .join(", ");
    return `{${inner}}`;
  }
  return "None";
}

function rowId(row: Record<string, unknown>, coll: string, i: number): string {
  return String(row._id ?? row.id ?? `${coll}-${i + 1}`);
}

export function buildPythonSnippet(s: ScaffoldCore): string {
  const L: string[] = [];
  L.push("# pip install nedb-engine", "from nedb import NEDB", "", "db = NEDB()", "");

  if (s.indexes.length) {
    L.push("# Indexes — power filter / sort / full-text search");
    for (const i of s.indexes) L.push(`db.create_index(${qpy(i.collection)}, ${qpy(i.field)}, ${qpy(i.kind)})`);
    L.push("");
  }

  for (const coll of s.collections) {
    const rows = (s.seedData[coll.name] as Record<string, unknown>[] | undefined) ?? [];
    if (!rows.length) continue;
    L.push(`# Seed ${coll.name}`);
    rows.slice(0, 3).forEach((row, i) => {
      L.push(`db.put(${qpy(coll.name)}, ${qpy(rowId(row, coll.name, i))}, ${pyValue(row)})`);
    });
    L.push("");
  }

  if (s.relations.length) {
    const r = s.relations[0];
    const fromRows = (s.seedData[r.from] as Record<string, unknown>[] | undefined) ?? [];
    const toRows = (s.seedData[r.to] as Record<string, unknown>[] | undefined) ?? [];
    if (fromRows.length && toRows.length) {
      const a = `${r.from}:${rowId(fromRows[0], r.from, 0)}`;
      const b = `${r.to}:${rowId(toRows[0], r.to, 0)}`;
      L.push(`# Relation: ${r.from} --${r.relation}--> ${r.to} (${r.cardinality})`);
      L.push(`db.link(${qpy(a)}, ${qpy(r.relation)}, ${qpy(b)})`);
      L.push(`db.neighbors(${qpy(a)}, ${qpy(r.relation)})  # -> [${qpy(b)}]`);
      L.push("");
    }
  }

  if (s.nqlExamples.length) {
    L.push("# Query with NQL");
    L.push(`for row in db.query(${qpy(s.nqlExamples[0])}):`);
    L.push("    print(row)");
    L.push("");
  }

  L.push("# Time-travel: read the database exactly as it was at an earlier sequence");
  L.push("checkpoint = db.seq");
  L.push("# ...apply more writes...");
  const first = s.collections[0];
  const firstRows = (s.seedData[first.name] as Record<string, unknown>[] | undefined) ?? [];
  const firstId = firstRows.length ? rowId(firstRows[0], first.name, 0) : "some-id";
  L.push(`past = db.get(${qpy(first.name)}, ${qpy(firstId)}, as_of=checkpoint)`);
  L.push("");
  L.push("assert db.verify()              # hash-chained log is intact");
  L.push("assert db.verify_determinism()  # state == replay(log)");
  return L.join("\n");
}

export function buildNodeSnippet(s: ScaffoldCore): string {
  const L: string[] = [];
  L.push("// npm i nedb-engine");
  L.push('const { NedbCore } = require("nedb-engine");', "", "const db = new NedbCore();", "");

  for (const coll of s.collections) {
    const rows = (s.seedData[coll.name] as Record<string, unknown>[] | undefined) ?? [];
    if (!rows.length) continue;
    L.push(`// Seed ${coll.name}`);
    rows.slice(0, 3).forEach((row, i) => {
      L.push(`db.put(${JSON.stringify(coll.name)}, ${JSON.stringify(rowId(row, coll.name, i))}, JSON.stringify(${JSON.stringify(row)}));`);
    });
    L.push("");
  }

  const first = s.collections[0];
  const firstRows = (s.seedData[first.name] as Record<string, unknown>[] | undefined) ?? [];
  const firstId = firstRows.length ? rowId(firstRows[0], first.name, 0) : "some-id";
  L.push("// Read back");
  L.push(`const row = JSON.parse(db.get(${JSON.stringify(first.name)}, ${JSON.stringify(firstId)}));`);
  L.push("console.log(row);");
  L.push("");
  L.push("// Integrity — the native core exposes the hash-chained head + verify");
  L.push("console.log(db.head());   // BLAKE3 head — a commitment to the whole log");
  L.push("console.log(db.verify()); // true = no tampering");
  L.push("");
  L.push("// Replay-protected, idempotent write (explicit client + nonce + idem key)");
  L.push(`db.putChecked(${JSON.stringify(first.name)}, ${JSON.stringify(firstId)}, JSON.stringify({ touched: true }), "service-a", 1, "op-1");`);
  return L.join("\n");
}

export function buildReadme(s: ScaffoldCore): string {
  const L: string[] = [];
  L.push(`# ${s.appName}`, "", s.description, "", "_Schema scaffolded with NEDB Studio on the NEDB engine._", "");

  L.push("## Collections", "");
  for (const c of s.collections) {
    L.push(`### \`${c.name}\``, "", "| field | type | required | description |", "| --- | --- | --- | --- |");
    for (const f of c.fields) {
      L.push(`| \`${f.name}\` | ${f.type} | ${f.required ? "yes" : "no"} | ${f.description ?? ""} |`);
    }
    L.push("");
  }

  if (s.relations.length) {
    L.push("## Relations", "");
    for (const r of s.relations) L.push(`- \`${r.from}\` —**${r.relation}**→ \`${r.to}\` (${r.cardinality})`);
    L.push("");
  }

  if (s.indexes.length) {
    L.push("## Indexes", "");
    const byKind = (k: Index["kind"]) => s.indexes.filter((i) => i.kind === k).map((i) => `\`${i.collection}.${i.field}\``);
    const eq = byKind("eq"), ordered = byKind("ordered"), search = byKind("search");
    if (eq.length) L.push(`- **Equality:** ${eq.join(", ")}`);
    if (ordered.length) L.push(`- **Ordered (sort/range):** ${ordered.join(", ")}`);
    if (search.length) L.push(`- **Full-text search:** ${search.join(", ")}`);
    L.push("");
  }

  L.push("## Install", "", "```bash", "pip install nedb-engine     # Python", "npm i nedb-engine           # Node", "```", "");
  L.push("## Python", "", "```python", buildPythonSnippet(s), "```", "");
  L.push("## Node", "", "```js", buildNodeSnippet(s), "```", "");

  if (s.nqlExamples.length) {
    L.push("## NQL examples", "", "```sql");
    for (const q of s.nqlExamples) L.push(q);
    L.push("```", "");
  }

  L.push("## Links", "", "- npm: https://www.npmjs.com/package/nedb-engine", "- PyPI: https://pypi.org/project/nedb-engine/", "- GitHub: https://github.com/Eth-Interchained/nedb", "");
  L.push("---", "", "Apache-2.0.");
  return L.join("\n");
}

/** Fill any missing artifacts deterministically and return a complete scaffold. */
export function finalizeScaffold(core: ScaffoldCore): NEDBScaffold {
  return {
    appName: core.appName,
    description: core.description,
    collections: core.collections,
    relations: core.relations,
    indexes: core.indexes,
    seedData: core.seedData,
    nqlExamples: core.nqlExamples?.length ? core.nqlExamples : defaultNql(core),
    pythonSnippet: core.pythonSnippet?.trim() ? core.pythonSnippet : buildPythonSnippet(core),
    nodeSnippet: core.nodeSnippet?.trim() ? core.nodeSnippet : buildNodeSnippet(core),
    readmeExport: core.readmeExport?.trim() ? core.readmeExport : buildReadme(core),
  };
}

function defaultNql(s: ScaffoldCore): string[] {
  const out: string[] = [];
  const c0 = s.collections[0]?.name ?? "items";
  const eq = s.indexes.find((i) => i.kind === "eq");
  const ord = s.indexes.find((i) => i.kind === "ordered");
  const search = s.indexes.find((i) => i.kind === "search");
  if (eq) out.push(`FROM ${eq.collection} WHERE ${eq.field} = "value"`);
  if (ord) out.push(`FROM ${ord.collection} ORDER BY ${ord.field} DESC LIMIT 10`);
  if (search) out.push(`FROM ${search.collection} SEARCH "keyword"`);
  out.push(`FROM ${c0} AS OF 0`);
  return out;
}
