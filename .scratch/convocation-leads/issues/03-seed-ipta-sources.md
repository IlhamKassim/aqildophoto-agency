# 03 — Seed real public-university (IPTA) scraper sources

**What to build:** Concrete `ScraperSource` implementations for an initial batch of Malaysia's public universities, registered with the runner from Ticket 02.

**Blocked by:** 02 — Scraper framework

**Status:** ready-for-agent

- [ ] Implement and register `ScraperSource`s for an initial named batch of public universities (e.g. UM, UKM, UPM, USM, UTM), each parsing that university's own real, publicly reachable convocation-announcement page
- [ ] Each source's parser is tested against a fixture captured from that real page (not a live network call in tests)
- [ ] Adding a further university is possible by writing one more `ScraperSource` implementation and registering it — no changes needed to the runner, registry, or scheduler
- [ ] Document (in a short README or code comment at the source registry) which public universities remain unimplemented, so growing coverage is a visible, trackable list rather than an open-ended unknown
- [ ] Full IPTA coverage and any IPTS/private-institution coverage are explicitly out of scope for this ticket — see the PRD's scope note
