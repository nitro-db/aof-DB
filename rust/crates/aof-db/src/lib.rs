//! aof-db
//!
//! The fast, lightweight distribution of NEDB: append-only op-log lineage, minimal footprint, built for speed.
//!
//! Re-exports the full `nedb-engine` API unchanged. aof-db's distribution
//! defaults — the append-only v3 segment store with macOS fast-fsync
//! (group-commit, one fsync per batch) — are applied by setting the engine's
//! existing env knobs before a `Db` is opened: programmatically via
//! [`apply_distro_defaults`], and automatically by the npm `main` shim and the
//! `nedbd-v2` daemon shim. No engine fork, no flags.
pub use nedb_engine::*;

/// Apply aof-db's default engine modes — the append-only v3 segment store with
/// macOS fast-fsync — unless the caller has already chosen. Call once before
/// opening a [`Db`]. Set-if-unset: explicit `NEDB_DAG_V3` / `NEDB_FAST_FSYNC`
/// (including `0`) always win.
pub fn apply_distro_defaults() {
    if std::env::var_os("NEDB_DAG_V3").is_none() {
        std::env::set_var("NEDB_DAG_V3", "1");
    }
    if std::env::var_os("NEDB_FAST_FSYNC").is_none() {
        std::env::set_var("NEDB_FAST_FSYNC", "1");
    }
}
