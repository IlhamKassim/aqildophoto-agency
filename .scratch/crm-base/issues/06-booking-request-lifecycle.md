# 06 — Booking Request lifecycle

**What to build:** A Student can request an open Time Slot with a chosen Package and Add-ons. The Photographer can accept or reject the request, and an unanswered request auto-expires after the response deadline — with the Time Slot's open/locked state always reflecting the current request state.

**Blocked by:** 05 — Student browsing

**Status:** ready-for-agent

- [ ] A Student can submit a Booking Request for an open Time Slot, selecting a Package and any Add-ons
- [ ] Submitting a Booking Request immediately locks the Time Slot — it no longer appears as open to other Students
- [ ] A Photographer can accept a Booking Request, transitioning the Booking to Accepted
- [ ] A Photographer can reject a Booking Request, transitioning the Time Slot back to open and the Booking Request to Rejected
- [ ] A Booking Request that receives no response within the configured response deadline (default 48 hours) automatically transitions to Expired and reopens the Time Slot
- [ ] Only one active Booking Request or Booking may reference a given Time Slot at a time
