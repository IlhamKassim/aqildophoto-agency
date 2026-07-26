# 01 — ConvocationLeadRegistry domain module

**What to build:** A new domain module, `ConvocationLeadRegistry`, storing Convocation Leads (university, date, venue nullable, dismissed flag) via SQLite, following the same seam as the other 7 domain modules.

**Blocked by:** none (new module, own table)

**Status:** done

- [x] `addLead(university, date, venue?)` creates a Lead
- [x] `listUpcomingLeads(now)` returns non-dismissed Leads with `date` between `now` and `now + 6 months`, ordered by date ascending
- [x] `dismissLead(id)` marks a Lead dismissed; dismissed Leads never appear in `listUpcomingLeads`
- [x] `dismissLead` throws on an unknown id (mirrors existing domain modules' behavior on invalid ids)
- [x] Data survives re-instantiating `ConvocationLeadRegistry` against the same database file/connection
- [x] Tests use an in-memory SQLite database, asserting on returned state only — same style as the existing 68 tests
