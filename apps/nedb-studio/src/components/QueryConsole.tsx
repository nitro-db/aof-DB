import React, { useState } from "react";
import type { NEDBScaffold } from "../lib/types";
import { executeNql, type QueryResult } from "../lib/nql";
import { compileNql } from "../lib/api";

/**
 * The "phpMyAdmin moment": ask in plain English → AiAssist compiles to NQL (shown
 * as the verifiable, editable intermediate) → the browser runs it against the
 * scaffold's seed data and renders a results table. Works in mock mode too.
 */
export function QueryConsole({ scaffold }: { scaffold: NEDBScaffold }): React.ReactElement {
  const first = scaffold.collections[0]?.name ?? "rows";
  const [nl, setNl] = useState("");
  const [nql, setNql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [mode, setMode] = useState<"mock" | "live" | null>(null);

  const examples = [
    `Show active ${first}, newest first`,
    `Top 5 ${first}`,
    `Search ${first} for "a"`,
  ];

  async function ask(text?: string): Promise<void> {
    const q = (text ?? nl).trim();
    if (!q) return;
    setNl(q);
    setCompiling(true);
    try {
      const schema = {
        collections: scaffold.collections,
        relations: scaffold.relations,
        indexes: scaffold.indexes,
      };
      const res = await compileNql(q, schema);
      setNql(res.nql);
      setMode(res.mode);
      setResult(executeNql(res.nql, scaffold));
    } catch (e) {
      setResult({ rows: [], columns: [], count: 0, error: String(e) });
    } finally {
      setCompiling(false);
    }
  }

  function run(): void {
    if (nql.trim()) setResult(executeNql(nql, scaffold));
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">
          QUERY CONSOLE <span className="text-slate-600">— natural language → NQL</span>
        </h2>
        {mode ? (
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
              (mode === "live" ? "bg-signal-green/15 text-signal-green" : "bg-signal-amber/15 text-signal-amber")
            }
          >
            {mode === "live" ? "● AiAssist" : "● heuristic"}
          </span>
        ) : null}
      </div>

      {/* natural-language input */}
      <div className="flex gap-2">
        <input
          value={nl}
          onChange={(e) => setNl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void ask(); }}
          placeholder={`Ask in plain English — e.g. "active ${first}, newest first"`}
          className="glass-soft flex-1 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent/50"
        />
        <button onClick={() => void ask()} disabled={compiling || !nl.trim()} className="btn-primary disabled:opacity-50">
          {compiling ? "Asking…" : "Ask"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button key={ex} onClick={() => void ask(ex)} className="chip">
            {ex}
          </button>
        ))}
      </div>

      {/* compiled NQL — the verifiable, editable intermediate */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">NQL</span>
        <input
          value={nql}
          onChange={(e) => setNql(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          placeholder="FROM … WHERE … ORDER BY … LIMIT …"
          spellCheck={false}
          className="glass-soft code flex-1 rounded-lg px-3 py-2 text-accent-soft outline-none focus:border-accent/50"
        />
        <button onClick={run} disabled={!nql.trim()} className="btn-ghost disabled:opacity-50">
          Run
        </button>
      </div>

      {/* results */}
      <div className="glass-soft flex-1 overflow-auto rounded-xl">
        {result == null ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
            Ask a question, or edit the NQL and hit Run. Queries execute against the seed data, in-browser.
          </div>
        ) : result.error ? (
          <div className="p-4 text-sm text-signal-red">{result.error}</div>
        ) : result.rows.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            0 rows.{result.note ? ` ${result.note}` : ""}
          </div>
        ) : (
          <ResultsTable result={result} />
        )}
      </div>
    </div>
  );
}

function ResultsTable({ result }: { result: QueryResult }): React.ReactElement {
  const cell = (v: unknown): string =>
    v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return (
    <div className="overflow-auto">
      <div className="px-3 pt-3 text-[11px] text-slate-500">
        {result.count} row{result.count === 1 ? "" : "s"}
        {result.note ? ` · ${result.note}` : ""}
      </div>
      <table className="w-full border-collapse text-left font-mono text-[12px]">
        <thead>
          <tr className="border-b border-white/10 text-slate-400">
            {result.columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
              {result.columns.map((c) => (
                <td key={c} className="max-w-[260px] truncate px-3 py-1.5 text-slate-200" title={cell(row[c])}>
                  {cell(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
