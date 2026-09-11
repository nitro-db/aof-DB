# Third-party licenses — aof-db

**The Change License does not relicense dependencies.** When aof-db 4.0.0
becomes Apache-2.0 on 2030-09-11, that applies to its own source. Every
dependency keeps its own terms, permanently.

aof-db is a distribution of NEDB and carries the same dependency graph, but
this inventory is generated from THIS repository's own `cargo metadata` rather
than copied from the flagship — a copied inventory is a claim, not a check.

## Rust

Third-party crates in the dependency graph: **175**

| Crates | SPDX expression |
|---:|---|
| 101 | `MIT OR Apache-2.0` |
| 36 | `MIT` |
| 11 | `Apache-2.0 OR MIT` |
| 4 | `Apache-2.0` |
| 4 | `MIT/Apache-2.0` |
| 3 | `Unlicense OR MIT` |
| 3 | `Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT` |
| 2 | `Unlicense/MIT` |
| 2 | `BSD-2-Clause OR Apache-2.0 OR MIT` |
| 1 | `CC0-1.0 OR Apache-2.0 OR Apache-2.0 WITH LLVM-exception` |
| 1 | `CC0-1.0 OR MIT-0 OR Apache-2.0` |
| 1 | `ISC` |
| 1 | `MIT AND BSD-3-Clause` |
| 1 | `MIT OR Apache-2.0 OR LGPL-2.1-or-later` |
| 1 | `Apache-2.0 OR BSL-1.0` |
| 1 | `BSD-3-Clause` |
| 1 | `Apache-2.0 WITH LLVM-exception` |
| 1 | `(MIT OR Apache-2.0) AND Unicode-3.0` |

**No copyleft obligation in this graph.** Every `OR` expression offers a
permissive option and this distribution takes it. No `GPL`, `AGPL`, `SSPL` or
`BUSL` third-party dependency exists here; the BUSL-1.1 crates cargo reports
are Interchained-owned, which is this project's own license rather than an
inbound obligation.

## Python / Node

Identical to the flagship: `pycryptodome` (BSD + public domain) required for
AES-256-GCM at rest, `cryptography` (`Apache-2.0 OR BSD-3-Clause`) optional as
an alternative backend, and **no npm runtime dependencies** at all.

Full detail, including the test-only dependencies and the regeneration command:
https://github.com/Eth-Interchained/nedb/blob/master/THIRD_PARTY.md

---

*SPDX-FileCopyrightText: 2026 INTERCHAINED LLC*
*SPDX-License-Identifier: BUSL-1.1*
