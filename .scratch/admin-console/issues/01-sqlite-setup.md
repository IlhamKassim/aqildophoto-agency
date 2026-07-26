# 01 — SQLite setup

**What to build:** The `better-sqlite3` dependency, a way to open/create the SQLite database file, and schema (table) creation for the 5 entities that need persistence (Photographers, ConvocationEvents, Packages, AddOns, TimeSlots, Bookings — note AddOns and Bookings are sub-entities of Packages/the booking flow but get their own tables).

**Blocked by:** None — can start immediately

**Status:** done

- [x] `better-sqlite3` is added as a dependency
- [x] A function/module exists that opens a SQLite database at a given file path (or `:memory:` for tests) and creates all required tables if they don't exist
- [x] Schema fields mirror the existing TypeScript interfaces field-for-field (e.g. `Photographer`, `ConvocationEvent`, `Package`, `AddOn`, `TimeSlot`, `Booking`)
- [x] Calling the setup function twice against the same file does not error or duplicate tables (idempotent)
