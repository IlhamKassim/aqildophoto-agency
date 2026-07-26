# 04 — In-process scheduler wiring

**What to build:** The scraper runner (Ticket 02) runs automatically on a daily schedule, started as a side effect of the Next.js server booting, per ADR-0003.

**Blocked by:** 02 — Scraper framework, 03 — Seed IPTA sources

**Status:** done

- [x] A scheduler (`node-cron`) is started once, from `instrumentation.ts` (Next.js's own server-startup hook) alongside the existing singleton domain-module wiring
- [x] The schedule runs the scraper runner once daily
- [x] Starting the scheduler twice (e.g. due to Next.js dev-mode module reloading) does not register duplicate cron jobs — guarded via `globalThis`, same pattern as `getServices()`
- [x] A manual way to trigger a run immediately exists for local verification: `POST /api/convocation-leads/scrape-now`, verified live against the real Universiti Malaya source
