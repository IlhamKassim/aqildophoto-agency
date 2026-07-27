# 06 — Spot-check IPTS (private university) scraper candidates

**What to build:** Extend the IPTA-only source survey (Ticket 03) to an initial batch of 20 IPTS (private university / university college) candidates, following the same real-fetch-and-verify standard — no fabricated parsers against unverified guessed page structure.

**Blocked by:** 03 — Seed IPTA sources

**Status:** done

## Context

A first spot-check of 8 IPTS candidates (Taylor's, Sunway, UCSI, Nottingham Malaysia, Heriot-Watt Malaysia, MMU, APU, Monash Malaysia) found none currently scrapable: 2026 dates already passed by the time they were checked (Taylor's, Sunway, UCSI, Nottingham Malaysia, Heriot-Watt Malaysia), no date posted yet (MMU), or scraping blocked outright — login-gated or HTTP 403 (APU, Monash Malaysia).

This ticket extends that list to 20 total by adding 12 more candidates, chosen for being well-resourced institutions most likely to run a clean, plain-HTML, publicly reachable convocation-dates page (the same trait that made the UM and UNIMAS IPTA sources viable) — not chosen by enrollment size or geography.

## The 12 new candidates

- [x] Tunku Abdul Rahman University of Management and Technology (TAR UMT) — not viable (image/PDF-only)
- [x] Universiti Tenaga Nasional (UNITEN) — not viable (date passed)
- [x] Universiti Teknologi Petronas (UTP) — viable, implemented as `utp-convocation-source.ts`
- [x] Curtin University Malaysia — not viable (date passed)
- [x] Swinburne University of Technology Sarawak Campus — not viable (blocked — Cloudflare 403)
- [x] INTI International University — not viable (no date posted yet)
- [x] SEGi University — not viable (no date posted yet)
- [x] HELP University — not viable (date passed)
- [x] Management and Science University (MSU) — not viable (date passed)
- [x] Xiamen University Malaysia — not viable (no date posted yet)
- [x] UOW Malaysia KDU University College — not viable (date passed)
- [x] Limkokwing University of Creative Technology — not viable (no date posted yet)

For each: check for a live, plain-HTML (not login-gated, not PDF/image-only) convocation-dates page with a confirmed future date. Record the outcome (viable / date passed / not yet posted / blocked / other) the same way the IPTA and first-8-IPTS checks were recorded.

## Agent Brief

**Category:** enhancement
**Summary:** Spot-check the 12 IPTS candidates above for a scrapable convocation-dates page, and implement a verified `ScraperSource` for any that pass.

**Current behavior:**
`allScraperSources` (implementing the `ScraperSource` interface: `id`, `name`, `fetchCandidates(): Promise<LeadCandidate[]>`) currently holds 2 real sources, both IPTA (Universiti Malaya, Universiti Malaysia Sarawak). A parallel `UNIMPLEMENTED_IPTA_UNIVERSITIES` list documents IPTA candidates checked and found not currently viable. No equivalent tracking exists yet for IPTS candidates — the first 8 IPTS checks (Taylor's, Sunway, UCSI, Nottingham Malaysia, Heriot-Watt Malaysia, MMU, APU, Monash Malaysia — all found non-viable) live only in this ticket's history, not in code.

**Desired behavior:**
Each of the 12 named candidates is checked for a live, plain-HTML (not login-gated, not PDF/image-only), publicly reachable convocation-dates page carrying a confirmed future date. For each:
- **Viable** → implement a real `ScraperSource` (same shape as the UM/UNIMAS sources: a pure `parse*(html)` function plus a `create*Source()` factory that fetches and parses), registered in `allScraperSources`, with a test asserting on a fixture captured from the real page (no live network calls in tests).
- **Not viable** → recorded with a reason (date already passed / no date posted yet / blocked — login-gated, HTTP error, or image/PDF-only / other), in an IPTS-equivalent of `UNIMPLEMENTED_IPTA_UNIVERSITIES` so the outcome is visible and not re-checked from scratch later. This new list should also capture the 8 already-checked IPTS candidates and their recorded reasons (see ticket body above), not just these 12.

No parser is ever written against guessed or unverified page structure — every implemented source must be checked against the real, currently-live page first, same standard as Ticket 03.

**Key interfaces:**
- `ScraperSource` (`scraper-source.ts`) — unchanged, implement against this
- `allScraperSources: ScraperSource[]` — append any newly-viable sources here
- A new exported constant analogous to `UNIMPLEMENTED_IPTA_UNIVERSITIES`, covering IPTS candidates checked and found non-viable, each with a brief reason

**Acceptance criteria:**
- [x] All 12 new candidates are checked; each has a recorded outcome (viable-and-implemented, or non-viable-with-reason)
- [x] Every viable candidate has a real `ScraperSource` implementation registered in `allScraperSources`, tested against a captured fixture
- [x] Every non-viable candidate (both the 12 new ones and the 8 already-checked) is recorded in an IPTS unimplemented/non-viable tracking list analogous to `UNIMPLEMENTED_IPTA_UNIVERSITIES`
- [x] `CONTEXT.md`'s IPTS entry stays accurate to what's implemented
- [x] This ticket's `Status:` is updated to `done`, and `PRD.md`'s top-level `Status:` is reconsidered (back to `done` if this was the only open ticket)
- [x] Work is committed to `main` per this repo's existing convention (see `CLAUDE.md` for required commit-identity flags), matching how every prior ticket in this feature was landed

**Out of scope:**
- Full IPTS coverage beyond these 20 total candidates (8 already-checked + these 12) — see `PRD.md`'s scope note
- Any conversion/promotion action linking a Convocation Lead to a Convocation Event
- Re-checking IPTA candidates (separate, already-exhausted list)

## Comments

Checked all 12 new candidates by actually fetching each institution's own official page (curl with a browser user-agent, falling back to WebFetch where curl was blocked) and reading the real HTML — no parser was written against a guessed structure.

**1 of 12 viable:** Universiti Teknologi Petronas (UTP). Its SharePoint "Upcoming Events" listing (`https://www.utp.edu.my/Pages/Upcoming-Events.aspx`) is plain, unauthenticated HTML showing "UTP 26th Convocation Ceremony" on two rows (1-2 Nov). The listing rows carry no year, so the parser resolves the year from the page's own embedded render timestamp (`_spPageContextInfo.serverTime`) rather than the system clock, keeping the parse function pure and the test deterministic. Implemented as `src/utp-convocation-source.ts` + `src/utp-convocation-source.test.ts` + `src/fixtures/utp-upcoming-events-2026.html`, and registered in `allScraperSources`.

**11 of 12 not viable**, each recorded with a reason in the new `UNCONFIRMED_IPTS_UNIVERSITIES` constant in `scraper-sources.ts` (alongside the 8 candidates from the earlier pre-Ticket-06 check, bringing the tracked total to 20):
- TAR UMT — image/PDF-only (schedule only exists as a PDF booklet)
- UNITEN — date passed (latest confirmed date Nov 2025)
- Curtin Malaysia — date passed (16-17 Apr 2026)
- Swinburne Sarawak — blocked (whole domain behind a Cloudflare managed challenge, HTTP 403)
- INTI International — no date posted yet (latest on-site mention is Jul 2025)
- SEGi — no date posted yet (official convocation page is stale, dated 2019)
- HELP University — date passed (36th convocation was 10 May 2026)
- MSU — date passed (37th convocation was 17-18 May 2026)
- Xiamen Malaysia — no date posted yet (only a retrospective article about a Sep 2025 ceremony)
- UOW Malaysia KDU — date passed (22-23 Nov 2025)
- Limkokwing — no date posted yet (no 2025/2026 convocation content found on official site)

`npm test` passes (99/99, including 4 new tests for the UTP source). `CONTEXT.md`'s IPTS entry now points to both the implemented UTP source and `UNCONFIRMED_IPTS_UNIVERSITIES`.
