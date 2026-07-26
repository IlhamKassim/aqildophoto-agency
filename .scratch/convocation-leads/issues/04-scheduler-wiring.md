# 04 — In-process scheduler wiring

**What to build:** The scraper runner (Ticket 02) runs automatically on a daily schedule, started as a side effect of the Next.js server booting, per ADR-0003.

**Blocked by:** 02 — Scraper framework, 03 — Seed IPTA sources

**Status:** ready-for-agent

- [ ] A scheduler (e.g. `node-cron`) is started once, alongside the existing singleton domain-module wiring in the server startup path
- [ ] The schedule runs `runAllScraperSources` once daily
- [ ] Starting the scheduler twice (e.g. due to Next.js dev-mode module reloading) does not register duplicate cron jobs
- [ ] A manual way to trigger a run immediately exists for local verification (e.g. a dev-only script or exposed function), without requiring a full day's wait to confirm it works
