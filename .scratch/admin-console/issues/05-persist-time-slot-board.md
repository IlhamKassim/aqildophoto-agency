# 05 — Persist TimeSlotBoard

**What to build:** `TimeSlotBoard`'s internal storage (opt-ins and Time Slots) moves from in-memory `Map`s/arrays to SQLite reads/writes, with no change to its public method signatures.

**Blocked by:** 01 — SQLite setup

**Status:** ready-for-agent

- [ ] `TimeSlotBoard` reads/writes opt-in and Time Slot records through SQLite instead of in-memory `Map`s/arrays
- [ ] All existing `TimeSlotBoard` tests pass unchanged (aside from test setup now pointing at a `:memory:` SQLite database)
- [ ] A new test confirms data survives re-instantiating `TimeSlotBoard` against the same database file/connection
- [ ] No change to `TimeSlotBoard`'s public method signatures or the `TimeSlot`/`TimeSlotWindow` types
