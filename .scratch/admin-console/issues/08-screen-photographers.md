# 08 — Photographers screen

**What to build:** The Agency operator can view all Photographers with their status, register a new one, and approve or reject Pending ones, from a single screen.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** ready-for-agent

- [ ] The screen lists all Photographers with their Photographer Status (Pending, Approved, Rejected)
- [ ] A form registers a new Photographer, creating them as Pending
- [ ] Pending Photographers have visible Approve and Reject actions that call the corresponding domain methods
- [ ] The list reflects changes immediately after an action (no manual refresh required)
- [ ] Errors thrown by the domain layer (e.g. approving a non-Pending Photographer) are surfaced to the operator, not silently swallowed
