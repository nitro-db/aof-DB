<h1 align="center">⚡ aof-db</h1>
<p align="center"><b>The embedded database that goes brrr.</b></p>
<p align="center"><i>Stupid-fast, append-only, zero-server storage you drop into your app and forget about.</i></p>

<p align="center">
<a href="https://pypi.org/project/aof-db/"><img alt="PyPI" src="https://img.shields.io/pypi/v/aof-db?label=PyPI&color=6366f1"></a>
<a href="https://www.npmjs.com/package/aof-db"><img alt="npm" src="https://img.shields.io/npm/v/aof-db?label=npm&color=00d4ff"></a>
<a href="https://crates.io/crates/aof-db"><img alt="crates.io" src="https://img.shields.io/crates/v/aof-db?label=crates.io&color=f97316"></a>
<a href="https://pypi.org/project/aof-db/"><img alt="Python" src="https://img.shields.io/pypi/pyversions/aof-db?label=python&color=3776ab"></a>
<a href="LICENSE"><img alt="licence" src="https://img.shields.io/badge/license-BUSL--1.1-f59e0b"></a>
<a href="LICENSE"><img alt="free under $1M" src="https://img.shields.io/badge/free%20under%20%241M%20revenue-22c55e"></a>
</p>

<p align="center"><i>One version across npm · PyPI · crates.io — every release ships aligned.</i></p>

---

```
63,400 writes/sec        1,340,000 point reads/sec        one fsync per batch
```

aof-db is a **tiny, blazing-fast, in-process** datastore. No daemon. No schema migrations. No 400 MB of dependencies. Just `import` it and start flooding it with data — it keeps up.

## Why people can't shut up about it

- 🏎️ **Fast where it counts.** Append-only + group-commit: one `fsync` per *batch*, not per record. Bigger batches get **cheaper per item**. Throughput goes *up* under load, not down.
- 🪶 **Featherweight.** In-process, near-zero footprint. Boots instantly, runs in memory, persists when you say so.
- 🧷 **Durable, not fragile.** Every write is hash-chained and the log replays clean on open — crash-safe without the ceremony.
- 🚀 **Scales with your ambition.** Same engine family as **crypto-database** — flip on the content-addressed DAG the day you need time-travel and tamper-evidence. Start fast, grow powerful.

## Install (10 seconds, tops)

```bash
npm install aof-db     #  pip install aof-db     #  cargo add aof-db
```

```js
import { NedbCore } from "aof-db";
const db = new NedbCore();
console.time("100k");
for (let i = 0; i < 100_000; i++) db.put("events", String(i), JSON.stringify({ t: Date.now(), i }));
db.flush();              // one durable group-commit for the whole burst
console.timeEnd("100k"); // …go on, time it.
```

## Built for

Edge & embedded · high-throughput event logging · local-first apps · game state · CLIs · **anywhere "just make it fast" beats "stand up a server."**

> **Note:** aof-db was previously published as `nitrodb`. The rename aligns the public package name with what it is — an append-only-file (AOF) fast-path distribution of NEDB. Same engine, same speed, new name.

<p align="center"><b>If aof-db just saved your afternoon, ⭐ it and tell a friend.</b></p>

---

<sub>aof-db is a distribution of the <b>NEDB</b> engine, tuned for speed + simplicity (benchmarks measured on commodity hardware — yours will vary). Engine development: <a href="https://github.com/Eth-Interchained/nedb">Eth-Interchained/nedb</a>. © Interchained LLC.</sub>
