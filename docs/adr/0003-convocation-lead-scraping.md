---
status: accepted
---

# Scrape all Malaysian universities for Convocation Leads via an in-process scheduler

The Agency operator wants visibility into upcoming Malaysian graduation ceremonies before deciding to pursue one, so Photographer recruitment can start with enough lead time. This introduces `Convocation Lead` (see `CONTEXT.md`): an externally-sourced, unconfirmed entity, deliberately separate from `Convocation Event` (which stays manually entered and "not imported from an external source," per its existing definition — a Lead is exactly the imported, unconfirmed counterpart that rule was written to exclude).

We chose to seed the scraper against **all known Malaysian universities** (public IPTA and private IPTS) rather than a small curated list, accepting that maintenance burden scales with source count indefinitely — different sites publish in different formats, any site can silently break its scraper on a redesign, and some may block scraping outright and need a manual fallback. This was a deliberate trade-off in favor of comprehensiveness over lower maintenance.

We chose an **in-process scheduler** (e.g. `node-cron`, started as a side effect of the Next.js server booting) over OS-level cron, and over the project's existing preference for manual-trigger-only sweeps (see the Scheduled Tasks screen and the PRD's "no real scheduled/background jobs" scope note). This is this project's first real background job. It was chosen because Leads lose their value if the operator has to remember to click "refresh" — and because the app is already a single long-lived process (ADR-0002), so an in-process timer adds no new infrastructure beyond a library.

## Considered Options

- **Curated source list** (rejected): lower maintenance, but the operator explicitly wants full national coverage, not just universities already top-of-mind.
- **Manual-trigger scraping**, matching `expireStaleBookingRequests`/`releaseEligiblePayouts` (rejected): consistent with existing project style, but undermines the point of automation — a Lead list that's only as fresh as the last time someone remembered to click a button.
- **OS-level cron hitting a local endpoint** (rejected): decouples scheduling from the app process, but adds a piece of config living outside the codebase, undiscoverable to anyone who just clones the repo.

## Consequences

- Per-source scraping failures must surface visibly to the operator (which source, when, why) rather than failing silently — a broken scraper otherwise just looks like "no leads from that university," indistinguishable from there being none.
- `Convocation Lead` and `Convocation Event` stay fully decoupled (no promotion/conversion action) — this keeps the imported, unverified data from ever silently becoming the Agency's authoritative record.
- The scheduler only fires while the Next.js process is running — the same limitation ADR-0002 already accepts for the rest of the app.
