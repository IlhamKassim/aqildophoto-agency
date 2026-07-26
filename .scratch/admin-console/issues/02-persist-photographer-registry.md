# 02 — Persist PhotographerRegistry

**What to build:** `PhotographerRegistry`'s internal storage moves from an in-memory `Map` to SQLite reads/writes, with no change to its public method signatures.

**Blocked by:** 01 — SQLite setup

**Status:** done

- [x] `PhotographerRegistry` reads/writes Photographer records through SQLite instead of an in-memory `Map`
- [x] All 8 existing `PhotographerRegistry` tests pass unchanged (aside from test setup now pointing at a `:memory:` SQLite database)
- [x] A new test confirms data survives re-instantiating `PhotographerRegistry` against the same database file/connection
- [x] No change to `PhotographerRegistry`'s public method signatures or the `Photographer`/`PhotographerStatus` types
