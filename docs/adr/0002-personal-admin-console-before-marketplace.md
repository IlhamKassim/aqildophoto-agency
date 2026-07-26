---
status: accepted
---

# Personal-use admin console before the public marketplace

Before building the public self-serve marketplace (Students and Photographers using the platform directly), we're building a personal-use admin console: a single internal tool, used only by the Agency operator, that wraps the existing domain layer (`PhotographerRegistry`, `ConvocationEventRegistry`, `PackageCatalog`, `TimeSlotBoard`, `BookingBoard`, `AgencyDashboard`) in a Next.js UI backed by SQLite (via `better-sqlite3`, no ORM). Students and Photographers continue to coordinate with the Agency by hand (WhatsApp, manual bank transfer); the console just replaces the domain layer's in-memory state with something that survives a restart, and gives the operator a UI instead of writing TypeScript by hand.

We chose this instead of going straight to the public marketplace because the business hasn't launched yet and this lets the Agency start operating for real — onboarding actual Photographers, taking actual Bookings — while the public product is still unbuilt. `better-sqlite3` was chosen over Prisma/Drizzle specifically to keep every domain method synchronous, matching the 57 existing tests without a rewrite to `async`/`await`.

## Consequences

- **No auth, localhost-only.** This console must never be deployed or exposed to the internet as-is — there is no login, and anyone who can reach it can approve Photographers, cancel Bookings, and see payment data. Auth is deliberately deferred, not accidentally missing.
- **SQLite becomes the source of truth**, not a nice-to-have layered on top — because Next.js can restart or hot-reload between requests, the domain modules' internals need to read/write through SQLite directly rather than relying on in-memory `Map`s persisting across requests.
- **This is explicitly transitional.** The user has stated intent to revisit and improve this once the public marketplace is built — the SQLite schema and admin UI are not guaranteed to survive that transition unchanged.
