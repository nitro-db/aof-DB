import React from "react";
import { Head, Link } from "@interchained/portal-react";
import { Nav } from "../src/components/Nav";

export const intent = {
  purpose: "Explain the NEDB engine and why its guarantees matter for AI agents",
  primaryAction: "Open the Studio",
  seoKeyword: "agent-native database architecture",
};

const SECTIONS: Array<{ h: string; p: string }> = [
  {
    h: "One append-only, hash-chained log",
    p: "Every mutation is an operation appended to a single log, chained by BLAKE3 hash. That one structure is the substrate for idempotency, replay protection, crash recovery, MVCC, and time-travel — simultaneously. State is a pure function of the log.",
  },
  {
    h: "Replay protection + idempotency",
    p: "Each write carries a strictly-monotonic per-client nonce and an optional idempotency key. Retries collapse to no-ops; stale or out-of-order operations are rejected. Safe under at-least-once delivery without app-level dedup.",
  },
  {
    h: "MVCC time-travel",
    p: "Because the log carries monotonic sequence numbers, you can read the database exactly as it existed AS OF any past sequence. Snapshot isolation for readers, deterministic replay for audits, and reproducible agent state for debugging.",
  },
  {
    h: "First-class relations + indexes",
    p: "Relations are adjacency lists with O(1) traversal — and the graph time-travels too. Equality, ordered, and full-text inverted indexes make data filterable, sortable, and searchable without bolt-on services.",
  },
  {
    h: "Cascade file compression",
    p: "A git-style file layer uses content-defined chunking, content-addressed dedup, and temperature tiers (fast warm codec, maximum-ratio cold archival) — strong compression with cross-version dedup.",
  },
  {
    h: "Merkle-rooted, provable history",
    p: "Every file version carries a Merkle root, so integrity is provable in O(log n) and the root can be anchored on-chain. State you can verify, not just store.",
  },
  {
    h: "Why this matters for AI agents",
    p: "Agents need durable, inspectable, reproducible memory. Replay protection makes tool calls safe to retry, time-travel makes 'what did the agent know then' answerable, and provable history makes agent state auditable. That is the foundation NEDB Studio scaffolds for you.",
  },
];

export default function AboutPage(): React.ReactElement {
  return (
    <>
      <Head
        title="How it works"
        description="The NEDB engine: a replay-protected, append-only hash-chained log with MVCC time-travel, relations, indexes, Cascade compression, and Merkle-rooted history — built for AI agents."
      />
      <Nav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs text-accent-soft">THE ENGINE UNDER THE STUDIO</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Agent-native database architecture</h1>
        <p className="mt-4 text-lg text-slate-300">
          NEDB Studio generates schemas for the NEDB engine — a versioned, self-compressing, time-traveling
          embedded database. Here is what makes that engine different, and why it matters for agents.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold text-white">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-slate-400">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/studio" className="btn-primary">
            Open the Studio →
          </Link>
          <Link href="/docs" className="btn-ghost">
            Read the docs
          </Link>
        </div>
      </main>
    </>
  );
}
