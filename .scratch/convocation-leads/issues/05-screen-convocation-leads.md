# 05 — Convocation Leads screen

**What to build:** A new standalone screen at `/convocation-leads` listing upcoming Leads (next 6 months) with a dismiss action, plus each scraper source's last-run status.

**Blocked by:** 01 — ConvocationLeadRegistry domain module, 02 — Scraper framework

**Status:** ready-for-agent

- [ ] Lists Leads from `listUpcomingLeads(now)` — university, date, venue if present
- [ ] A dismiss action on each Lead calls `dismissLead(id)` and removes it from the list without a manual refresh
- [ ] A per-source status section shows each source's last-run outcome (ok/failed), reason if failed, and timestamp
- [ ] An empty Leads list (nothing upcoming, or everything dismissed) renders a clear empty state, not a blank screen or error
- [ ] Follows the existing screen conventions: shared CSS primitives, Server Actions calling the domain module directly (no business logic in the action layer)
