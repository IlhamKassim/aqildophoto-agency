# 07 — Next.js scaffold + service wiring

**What to build:** A Next.js (App Router) project exists inside the repo, running on localhost with no auth, with a shared SQLite connection wired into singleton instances of all 5 persisted domain modules plus `AgencyDashboard` (composing over `BookingBoard`/`PhotographerRegistry`), accessible to Server Actions/route handlers.

**Blocked by:** 02 — Persist PhotographerRegistry, 03 — Persist ConvocationEventRegistry, 04 — Persist PackageCatalog, 05 — Persist TimeSlotBoard, 06 — Persist BookingBoard

**Status:** done

- [x] `npm run dev` boots a Next.js app reachable at localhost with no visible screens yet beyond a placeholder
- [x] A single shared SQLite database file is opened once at server startup
- [x] Singleton instances of `PhotographerRegistry`, `ConvocationEventRegistry`, `PackageCatalog`, `TimeSlotBoard`, `BookingBoard`, and `AgencyDashboard` are created against that shared connection and are reachable from Server Actions/route handlers
- [x] No authentication, login, or session handling exists anywhere in the app
