# 03 — Persist ConvocationEventRegistry

**What to build:** `ConvocationEventRegistry`'s internal storage moves from an in-memory array to SQLite reads/writes, with no change to its public method signatures.

**Blocked by:** 01 — SQLite setup

**Status:** done

- [x] `ConvocationEventRegistry` reads/writes Convocation Event records through SQLite instead of an in-memory array
- [x] All 4 existing `ConvocationEventRegistry` tests pass unchanged (aside from test setup now pointing at a `:memory:` SQLite database)
- [x] A new test confirms data survives re-instantiating `ConvocationEventRegistry` against the same database file/connection
- [x] No change to `ConvocationEventRegistry`'s public method signatures or the `ConvocationEvent`/`ConvocationEventDetails` types
