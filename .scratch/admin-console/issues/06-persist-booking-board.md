# 06 — Persist BookingBoard

**What to build:** `BookingBoard`'s internal storage (Bookings and delivery links) moves from in-memory `Map`s to SQLite reads/writes, with no change to its public method signatures.

**Blocked by:** 03 — Persist ConvocationEventRegistry, 04 — Persist PackageCatalog, 05 — Persist TimeSlotBoard

**Status:** done

- [x] `BookingBoard` reads/writes Booking records (including the delivery-link store) through SQLite instead of in-memory `Map`s
- [x] All existing `BookingBoard` tests pass unchanged (aside from test setup now pointing at a `:memory:` SQLite database, wiring real `ConvocationEventRegistry`/`PackageCatalog`/`TimeSlotBoard` instances as before)
- [x] A new test confirms data survives re-instantiating `BookingBoard` against the same database file/connection
- [x] No change to `BookingBoard`'s public method signatures or the `Booking`/`BookingStatus`/`CommissionSplit` types
