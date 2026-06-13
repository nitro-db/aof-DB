/**
 * System prompts for the two-pass generation pipeline:
 *   runner   → fast first-pass NEDBScaffold JSON from a natural-language prompt
 *   sentinel → validate / repair JSON that failed Zod or referential checks
 *
 * Both are sent through AiAssist (provider/model chosen in the UI). The output
 * is always plain JSON — the server parses + validates with the Zod schema in
 * src/lib/types.ts before anything reaches the browser.
 */

export const SCAFFOLD_SCHEMA_DOC = `
Return a single JSON object (no markdown, no prose) matching this TypeScript type:

type NEDBScaffold = {
  appName: string;
  description: string;
  collections: Array<{
    name: string;                       // snake_case plural, e.g. "users", "work_orders"
    fields: Array<{
      name: string;
      type: "string" | "number" | "boolean" | "datetime" | "json" | "file" | "reference";
      required?: boolean;
      description?: string;
    }>;
  }>;
  relations: Array<{
    from: string;                       // a collection name
    relation: string;                   // verb, e.g. "owns", "books", "authored"
    to: string;                         // a collection name
    cardinality: "one_to_one" | "one_to_many" | "many_to_many";
  }>;
  indexes: Array<{
    collection: string;                 // must exist in collections
    field: string;                      // must exist on that collection
    kind: "eq" | "ordered" | "search";  // eq=equality, ordered=sort/range, search=full-text
  }>;
  seedData: Record<string, any[]>;      // keys are collection names; 2-3 realistic rows each, include an "id"
  nqlExamples: string[];                // 3-5 NQL queries (see grammar below)
  pythonSnippet: string;                // may be "" — the server fills it deterministically
  nodeSnippet: string;                  // may be ""
  readmeExport: string;                 // may be ""
};

NQL grammar:
  FROM <collection> [AS OF <seq>] [WHERE <field> <op> <value> (AND ...)] [SEARCH "<text>"]
  [ORDER BY <field> [ASC|DESC]] [TRAVERSE <relation>] [LIMIT <n>]   ; op in = != < <= > >=

Rules:
- Every relation.from/to and index.collection MUST be a declared collection.
- Every index.field MUST exist on its collection.
- seedData keys MUST be declared collections; give each 2-3 realistic rows with an "id".
- Add eq indexes for fields you filter on, ordered for fields you sort/range on, search for free-text fields.
- Keep it focused: 3-7 collections. Use "reference" type for foreign keys.
- You MAY leave pythonSnippet/nodeSnippet/readmeExport as empty strings; the server generates them.
`.trim();

export function runnerSystem(): string {
  return [
    "You are a senior database architect for NEDB, an embedded, replay-protected,",
    "time-traveling database. Turn the user's app description into a clean, normalized",
    "schema scaffold. Output ONLY the JSON object — no markdown fences, no commentary.",
    "",
    SCAFFOLD_SCHEMA_DOC,
  ].join("\n");
}

export function runnerMessages(prompt: string): Array<{ role: "user"; content: string }> {
  return [{ role: "user", content: `Design an NEDB scaffold for this application:\n\n${prompt}` }];
}

export function sentinelSystem(): string {
  return [
    "You are a strict schema validator and repair pass for NEDB scaffolds.",
    "You are given a candidate JSON scaffold and a list of validation errors.",
    "Return a corrected JSON object that fixes EVERY error while preserving intent.",
    "Output ONLY the JSON object — no markdown, no commentary.",
    "",
    SCAFFOLD_SCHEMA_DOC,
  ].join("\n");
}

export function sentinelMessages(
  prompt: string,
  candidate: string,
  errors: string[],
): Array<{ role: "user"; content: string }> {
  return [
    {
      role: "user",
      content: [
        `Original app description:\n${prompt}`,
        "",
        `Candidate scaffold JSON:\n${candidate}`,
        "",
        `Validation errors to fix:\n- ${errors.join("\n- ")}`,
        "",
        "Return the corrected JSON object.",
      ].join("\n"),
    },
  ];
}

/** Pull a JSON object out of a model response that may have stray prose/fences. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

// ── Natural language → NQL (the query console) ────────────────────────────────

interface SchemaLite {
  collections: Array<{ name: string; fields: Array<{ name: string; type: string }> }>;
  relations: Array<{ from: string; relation: string; to: string }>;
  indexes?: Array<{ collection: string; field: string; kind: string }>;
}

export function nqlSystem(schema: SchemaLite): string {
  const cols = schema.collections
    .map((c) => `- ${c.name}(${c.fields.map((f) => f.name).join(", ")})`)
    .join("\n");
  const rels = schema.relations.length
    ? schema.relations.map((r) => `- ${r.from} --${r.relation}--> ${r.to}`).join("\n")
    : "- (none)";
  return [
    "You translate a natural-language request into a SINGLE NQL query for the NEDB engine.",
    "Output ONLY the NQL query on one line — no markdown, no quotes, no prose, no explanation.",
    "",
    "NQL grammar:",
    'FROM <collection> [AS OF <seq>] [WHERE <field> <op> <value> (AND <field> <op> <value>)*] [SEARCH "<text>"] [ORDER BY <field> [ASC|DESC]] [TRAVERSE <relation>] [LIMIT <n>]',
    "op ∈ = != < <= > >= . String values use double quotes. Only reference declared collections/fields.",
    "",
    "Collections and fields:",
    cols,
    "Relations (for TRAVERSE):",
    rels,
  ].join("\n");
}

export function nqlMessages(prompt: string): Array<{ role: "user"; content: string }> {
  return [{ role: "user", content: `Translate this to one NQL query: ${prompt}` }];
}

/** Pull a clean single-line NQL query out of a model response. */
export function extractNql(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  const fromLine = lines.find((l) => /^from\s/i.test(l));
  return (fromLine ?? lines[0] ?? t).replace(/^["'`]+|["'`;]+$/g, "").trim();
}
