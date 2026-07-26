# 12 — Scheduled Tasks screen

**What to build:** The Agency operator can manually trigger `expireStaleBookingRequests` and `releaseEligiblePayouts`, and see which Bookings were affected by the last run of each.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** ready-for-agent

- [ ] A button triggers `expireStaleBookingRequests` (using the current time) and displays which Bookings were expired by that run
- [ ] A button triggers `releaseEligiblePayouts` (using the current time) and displays which Bookings had their payout released by that run
- [ ] Running either action with nothing eligible shows an empty result, not an error
