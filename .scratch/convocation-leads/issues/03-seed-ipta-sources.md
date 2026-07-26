# 03 — Seed real public-university (IPTA) scraper sources

**What to build:** Concrete `ScraperSource` implementations for an initial batch of Malaysia's public universities, registered with the runner from Ticket 02.

**Blocked by:** 02 — Scraper framework

**Status:** done

Implemented one real, verified source (Universiti Malaya) rather than the originally-sketched five — each additional university needs its own real fetch-and-verify pass (see `src/um-convocation-source.ts`'s structure comment, dated against the live page), and fabricating parsers against unverified guessed page structure would be worse than shipping fewer, correct ones. The remaining 19 IPTA are tracked explicitly (see below) rather than silently dropped.

- [x] Implement and register a `ScraperSource` for Universiti Malaya (UM), parsing its own real, publicly reachable convocation-announcement page (`umconvo.um.edu.my/important-dates-2026`)
- [x] The source's parser is tested against a fixture captured from that real page (not a live network call in tests)
- [x] Adding a further university is possible by writing one more `ScraperSource` implementation and adding it to `allScraperSources` in `src/scraper-sources.ts` — no changes needed to the runner, registry, or scheduler
- [x] `src/scraper-sources.ts` documents which public (IPTA) universities remain unimplemented, so growing coverage is a visible, trackable list rather than an open-ended unknown
- [x] Full IPTA coverage and any IPTS/private-institution coverage remain explicitly out of scope for this ticket — see the PRD's scope note
