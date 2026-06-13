import React, { useState } from "react";
import { ARTIFACT_TABS, type ArtifactTab, type NEDBScaffold } from "../lib/types";

interface Artifact {
  body: string;
  filename: string;
}

function artifactFor(tab: ArtifactTab, s: NEDBScaffold): Artifact {
  switch (tab) {
    case "Schema JSON":
      return {
        body: JSON.stringify({ appName: s.appName, description: s.description, collections: s.collections }, null, 2),
        filename: "schema.json",
      };
    case "Relations":
      return { body: JSON.stringify(s.relations, null, 2), filename: "relations.json" };
    case "Indexes":
      return { body: JSON.stringify(s.indexes, null, 2), filename: "indexes.json" };
    case "Seed Data":
      return { body: JSON.stringify(s.seedData, null, 2), filename: "seed.json" };
    case "NQL Queries":
      return { body: s.nqlExamples.join("\n"), filename: "queries.nql" };
    case "Python":
      return { body: s.pythonSnippet, filename: "nedb_integration.py" };
    case "Node":
      return { body: s.nodeSnippet, filename: "nedb_integration.js" };
    case "README Export":
      return { body: s.readmeExport, filename: "README.md" };
    default:
      return { body: "", filename: "artifact.txt" };
  }
}

function download(filename: string, body: string): void {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ArtifactTabs({ scaffold }: { scaffold: NEDBScaffold }): React.ReactElement {
  const [tab, setTab] = useState<ArtifactTab>("Schema JSON");
  const [copied, setCopied] = useState(false);
  const art = artifactFor(tab, scaffold);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(art.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function downloadAll(): void {
    download(`${slug(scaffold.appName)}-nedb-scaffold.json`, JSON.stringify(scaffold, null, 2));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-2 py-2">
        {ARTIFACT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition " +
              (t === tab ? "bg-accent/20 text-white" : "text-slate-400 hover:text-white")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="font-mono text-xs text-slate-500">{art.filename}</span>
        <div className="flex gap-2">
          <button onClick={copy} className="chip">
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button onClick={() => download(art.filename, art.body)} className="chip">
            Download
          </button>
          <button onClick={downloadAll} className="chip border-accent/40 text-accent-soft">
            Export all (.json)
          </button>
        </div>
      </div>

      <pre className="code flex-1 overflow-auto whitespace-pre-wrap break-words px-4 pb-4 text-slate-200">
        {art.body || "—"}
      </pre>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
}
