# 04 — Persist PackageCatalog

**What to build:** `PackageCatalog`'s internal storage (Packages and Add-ons) moves from in-memory `Map`s to SQLite reads/writes, with no change to its public method signatures.

**Blocked by:** 01 — SQLite setup

**Status:** done

- [x] `PackageCatalog` reads/writes Package and Add-on records through SQLite instead of in-memory `Map`s
- [x] All existing `PackageCatalog` tests pass unchanged (aside from test setup now pointing at a `:memory:` SQLite database)
- [x] A new test confirms data survives re-instantiating `PackageCatalog` against the same database file/connection
- [x] No change to `PackageCatalog`'s public method signatures or the `Package`/`AddOn`/`PackageWithAddOns` types
