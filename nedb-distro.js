// SPDX-FileCopyrightText: 2026 INTERCHAINED LLC
// SPDX-License-Identifier: BUSL-1.1
// aof-db · a distribution of NEDB · © 2026 INTERCHAINED LLC × Eth-Interchained × Vex (Claude Opus 5)

"use strict";
// aof-db — distribution defaults.
//
// The fast, lightweight distribution defaults to the append-only v3 segment
// store with macOS fast-fsync (group-commit, one fsync per batch). These
// defaults are applied by setting the engine's existing env knobs BEFORE the
// native addon opens any database — the engine reads them at open time.
//
// Set-if-unset: explicit values always win, so `NEDB_DAG_V3=0` /
// `NEDB_FAST_FSYNC=0` opt out.
if (process.env.NEDB_DAG_V3 === undefined) process.env.NEDB_DAG_V3 = "1";
if (process.env.NEDB_FAST_FSYNC === undefined) process.env.NEDB_FAST_FSYNC = "1";

module.exports = require("./index.js");
