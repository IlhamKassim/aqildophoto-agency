# Convocation Leads

Status: done

## Problem Statement

The Agency operator currently only knows about a Convocation Event once staff have already decided to pursue it and manually entered it (see `CONTEXT.md`'s `Convocation Event` entry — "not imported from an external source"). There's no way to see what graduation ceremonies are coming up across Malaysia *before* that commitment is made, which means sourcing new ceremonies to pursue depends entirely on the operator's own manual research with no system support.

## Solution

Add a new entity, `Convocation Lead` (see `CONTEXT.md`), sourced by scraping Malaysian universities' own websites for upcoming graduation ceremony announcements. Leads are coarser than a Convocation Event (university + date, optional venue — no faculty) and fully decoupled from it: there's no conversion/promotion action, and a Lead is not filtered out even if a matching Convocation Event already exists. The scrape runs automatically on an in-process scheduler (see ADR-0003) rather than a manual trigger, since the value of the list depends on staying fresh without operator action. A new standalone "Convocation Leads" screen shows Leads within the next 6 months, each dismissible, alongside a per-source last-run status (ok/failed/reason/timestamp) so a broken or blocked scraper is visible rather than silently producing nothing.

**Scope note on "all Malaysian universities":** ADR-0003 records the decision to seed scraping broadly rather than a small curated list. In practice, this PRD seeds real, verifiable scraper sources for Malaysia's public universities (IPTA — a bounded, well-known list of ~20 institutions with legitimate public convocation-announcement pages). Extending coverage to the much larger and less standardized set of private institutions (IPTS/colleges) was left as a deliberately easy extension point (Ticket 03) rather than claimed as delivered in the initial pass — writing and verifying working scrapers against 400+ heterogeneous, frequently-redesigned sites is not something that can be responsibly done, or usefully verified, in one pass. Sources are added the same way regardless of count, so growing the list later is additive, not a rework. **IPTS sourcing's initial spot-check is now complete (Ticket 06)**: of the 20 IPTS institutions judged most likely to have a clean, scrapable convocation-dates page (see `CONTEXT.md`'s IPTS entry for scope), 1 (UTP) was viable and implemented; the other 19 were recorded as not currently viable, each with a reason, in `scraper-sources.ts`'s `UNCONFIRMED_IPTS_UNIVERSITIES`.

## User Stories

1. As the Agency operator, I want to see upcoming graduation ceremonies across Malaysia that I haven't already onboarded, so I know what to consider pursuing.
2. As the Agency operator, I want that list limited to the next 6 months, so I'm not shown ceremonies too far out to act on yet.
3. As the Agency operator, I want to dismiss a Lead I've decided not to pursue, so it stops cluttering the list without deleting the record.
4. As the Agency operator, I want to see whether each source's last scrape succeeded or failed (and why), so a broken or blocked scraper doesn't silently look like "no ceremonies happening."
5. As the Agency operator, I want the scrape to run automatically on a schedule, so the list stays current without me remembering to trigger it.
6. As the Agency operator, I want new scraper sources to be easy to add later, so growing coverage beyond the initial public-university list is additive.

## Implementation Decisions

- New domain module `ConvocationLeadRegistry`, following the existing seam: synchronous public methods, SQLite-backed via `better-sqlite3`, no ORM — same shape as the other 7 domain modules (see ADR-0002).
- Schema: one `ConvocationLeads` table (university, date, venue nullable, dismissed flag) and one `ScraperSourceRuns` table (source id, last-run timestamp, status, failure reason nullable) — mirroring the "one table per entity" convention.
- A `ScraperSource` interface (name, fetch + parse → candidate Leads) with one implementation per university. The scrape runner iterates all registered sources, catches and records per-source failures independently — one broken source never blocks the others.
- Scheduling via an in-process library (e.g. `node-cron`) started as a side effect of server startup, per ADR-0003. Frequency: daily (a graduation-date announcement doesn't need finer granularity, and daily keeps the scrape load on university sites polite).
- `Convocation Lead` and `Convocation Event` remain fully unrelated in code: no shared table, no cross-query, no conversion action, per the grill-with-docs decisions.
- New standalone screen `/convocation-leads`, following the existing screen conventions (shared CSS primitives from `20b252e`, Server Actions for the dismiss action, thin action layer calling the domain module directly).
- "Next 6 months" filtering happens in `ConvocationLeadRegistry.listUpcomingLeads(now)`, mirroring `ConvocationEventRegistry.listUpcomingConvocationEvents(now)`'s existing signature shape.

## Testing Decisions

- `ConvocationLeadRegistry` and the scrape runner are covered by domain-layer tests only, same style as the existing 68 tests — asserting on returned state, an in-memory SQLite database in test setup.
- Per-source scrapers are tested against fixture HTML/markup captured from each real source, not live network calls, so tests stay deterministic and don't depend on university sites being reachable.
- The Leads screen (Next.js UI) is not covered by automated tests, consistent with the admin-console PRD's existing testing decision — verified manually.

## Out of Scope

- Any conversion/promotion action linking a Convocation Lead to a Convocation Event.
- Filtering Leads that overlap an existing Convocation Event (explicitly rejected during grill-with-docs — the two stay independent).
- Full IPTS/private-institution coverage (see Scope note above) — Ticket 06 spot-checks an initial 20 candidates, not the full private-institution population (400+).
- Authentication or any change to this app's localhost-only, no-auth posture (ADR-0002 still applies in full).
- Real-time/instant scraping — daily is sufficient; no requirement for sub-day freshness.
