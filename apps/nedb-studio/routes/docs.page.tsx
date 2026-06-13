import React, { useState } from "react";
import { Head, Link } from "@interchained/portal-react";
import { Nav } from "../src/components/Nav";

export const intent = {
  purpose: "Get developers running: install, use Python and Node, connect AiAssist, run mock mode, export a scaffold",
  primaryAction: "Install nedb-engine",
  seoKeyword: "nedb-engine install docs",
};

function CodeBlock({ code }: { code: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="glass-soft relative rounded-xl">
      <button onClick={copy} className="chip absolute right-2 top-2">
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre className="code overflow-auto p-4 pr-20 text-slate-200">{code}</pre>
    </div>
  );
}

const INSTALL = "pip install nedb-engine     # Python\nnpm i nedb-engine           # Node";

const PYTHON = `from nedb import NEDB

db = NEDB()
db.create_index("users", "email", "eq")
db.create_index("users", "name", "search")

db.put("users", "u1", {"name": "Alice", "email": "alice@example.com"})

# filter / sort / search with NQL
db.query('FROM users SEARCH "alice"')

# time-travel: read state as of an earlier sequence
checkpoint = db.seq
db.put("users", "u1", {"name": "Alice", "email": "alice@new.com"})
db.get("users", "u1", as_of=checkpoint)   # the email before the change`;

const NODE = `const { NedbCore } = require("nedb-engine");

const db = new NedbCore();
db.put("users", "u1", JSON.stringify({ name: "Alice", email: "alice@example.com" }));

const row = JSON.parse(db.get("users", "u1"));
console.log(row);

console.log(db.head());   // BLAKE3 head — a commitment to the whole log
console.log(db.verify()); // true = no tampering`;

const ENV = `# Server-side only — the key never reaches the browser.
AIASSIST_BASE_URL=https://api.aiassist.net
AIASSIST_API_KEY=your_key_here
AIASSIST_DEFAULT_PROVIDER=anthropic
AIASSIST_DEFAULT_MODEL=claude-sonnet-4-6`;

const RUN = `# install
npm install

# dev: Portal app (:3000) + AiAssist API server (:3001) together
npm run dev

# production
npm run build && npm start`;

export default function DocsPage(): React.ReactElement {
  return (
    <>
      <Head
        title="Docs"
        description="Install nedb-engine from npm or PyPI, use it from Python and Node, connect AiAssist as the AI gateway, run mock mode, and export a scaffold."
      />
      <Nav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Docs</h1>
        <p className="mt-3 text-lg text-slate-300">
          Install the engine, generate a scaffold in the studio, and drop the exported snippets into your app.
        </p>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Install nedb-engine</h2>
          <CodeBlock code={INSTALL} />
          <p className="mt-2 text-sm text-slate-500">
            Native wheels (PyPI) and native addons (npm) ship from one Rust core, with a pure-Python fallback.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Use it from Python</h2>
          <CodeBlock code={PYTHON} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Use it from Node</h2>
          <CodeBlock code={NODE} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Connect AiAssist (the AI gateway)</h2>
          <p className="mb-3 text-sm text-slate-400">
            Generation routes through AiAssist — your provider, your model, your key. The studio reads these
            server-side and sends <span className="font-mono text-accent-soft">X-AiAssist-Provider</span> on every call.
          </p>
          <CodeBlock code={ENV} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Run the studio</h2>
          <CodeBlock code={RUN} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Mock mode</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            With no AiAssist credentials, the studio runs on deterministic templates — Contractor CRM, Salon
            booking, AI agent memory, Marketplace, and a generic fallback. Every feature works offline: schema
            graph, artifacts, and export. Add credentials to generate from any prompt.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Export a scaffold</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            In the studio, the right panel gives you Schema JSON, Relations, Indexes, Seed Data, NQL Queries,
            Python, Node, and a README — each copyable and downloadable, plus a one-click full export as a single
            JSON file.
          </p>
        </section>

        <div className="mt-12">
          <Link href="/studio" className="btn-primary">
            Open the Studio →
          </Link>
        </div>
      </main>
    </>
  );
}
