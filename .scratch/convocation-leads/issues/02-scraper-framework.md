# 02 — Pluggable scraper framework + per-source run status

**What to build:** A `ScraperSource` interface and a runner that executes every registered source, feeding successful results into `ConvocationLeadRegistry` and recording each source's last-run outcome independently.

**Blocked by:** 01 — ConvocationLeadRegistry domain module

**Status:** ready-for-agent

- [ ] `ScraperSource` interface: `{ id: string; name: string; fetchCandidates(): Promise<LeadCandidate[]> }`, where `LeadCandidate` is `{ university, date, venue? }`
- [ ] A runner (`runAllScraperSources(sources, registry)`) calls every registered source and adds each returned candidate as a Lead via `ConvocationLeadRegistry.addLead`
- [ ] A failure in one source's `fetchCandidates()` (thrown error or rejected promise) does not stop the other sources from running
- [ ] After a run, each source's outcome (`ok` or `failed` + reason) and timestamp is recorded and queryable — e.g. `getSourceRunStatuses(): SourceRunStatus[]`
- [ ] A source that returns zero candidates is recorded as `ok`, not `failed` — an empty result is not an error
- [ ] Tests use fake `ScraperSource` implementations (no real network calls) covering: all sources succeed, one source fails, a source throws synchronously vs. rejects
