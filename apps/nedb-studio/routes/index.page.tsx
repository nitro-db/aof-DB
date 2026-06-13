import React from "react";
import { Head, Link } from "@interchained/portal-react";
import { Nav } from "../src/components/Nav";

export const intent = {
  purpose: "Land developers and agent builders, communicate prompt-to-database value, drive them into the studio",
  primaryAction: "Generate Schema",
  seoKeyword: "prompt to database scaffolding",
};

const EXAMPLES = ["Contractor CRM", "Salon booking app", "AI agent memory store", "Marketplace backend"];

const FEATURES: Array<{ title: string; body: string }> = [
  { title: "Schema, not boilerplate", body: "Collections, fields, types, relations, indexes, search fields, and seed data — generated from one sentence." },
  { title: "Replay-protected writes", body: "Every write carries a monotonic nonce and idempotency key on a hash-chained log. Retries are no-ops; tampering is detectable." },
  { title: "Time-traveling storage", body: "Read the database exactly as it was at any past sequence. Audit, debug, and reproduce agent state on demand." },
  { title: "State you can verify", body: "MVCC snapshots and a Merkle-rooted history mean state is provable, not just stored — ideal for agent memory." },
  { title: "One engine, two runtimes", body: "Export Python and Node snippets that run on the same Rust core. Ship the same database in both ecosystems." },
  { title: "Bring your own gateway", body: "Generation runs through AiAssist — your provider, your model, your key. Or run fully offline in mock mode." },
];

export default function HomePage(): React.ReactElement {
  return (
    <>
      <Head
        title="NEDB Studio — Prompt-to-database scaffolding"
        description="Describe an app in plain language and get a validated NEDB schema: collections, relations, indexes, seed data, NQL, plus Python and Node snippets."
      />
      <Nav />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
          <p className="mb-4 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent-soft">
            agent-native database architecture
          </p>
          <h1 className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">
            NEDB Studio
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
            Prompt-to-database scaffolding for agent-native applications.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
            Generate schema, seed data, relations, indexes, and queries — on a time-traveling, replay-protected
            embedded engine. One engine. Python and Node. Rust at the core.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/studio" className="btn-primary text-base">
              Generate Schema →
            </Link>
            <Link href="/docs" className="btn-ghost text-base">
              Install nedb-engine
            </Link>
          </div>

          <div className="mt-10">
            <p className="mb-3 text-xs uppercase tracking-widest text-slate-600">Try an example</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <Link key={ex} href={`/studio?prompt=${encodeURIComponent(ex)}`} className="chip">
                  {ex}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-5">
                <h2 className="text-base font-semibold text-white">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
          <h2 className="text-3xl font-bold">From sentence to schema in seconds</h2>
          <p className="mt-3 text-slate-400">
            Describe it. Inspect the graph. Export Python, Node, NQL, and a README. Ship it on NEDB.
          </p>
          <div className="mt-7">
            <Link href="/studio" className="btn-primary text-base">
              Open the Studio →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="https://github.com/Eth-Interchained/nedb" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/nedb-engine" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            npm
          </a>
          <a href="https://pypi.org/project/nedb-engine/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            PyPI
          </a>
          <Link href="/about" className="hover:text-white">
            How it works
          </Link>
        </div>
        <p className="mt-4">NEDB Studio · Apache-2.0 · built on the NEDB engine.</p>
      </footer>
    </>
  );
}
