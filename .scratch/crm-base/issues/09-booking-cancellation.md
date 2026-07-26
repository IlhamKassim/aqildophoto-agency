# 09 — Booking cancellation

**What to build:** A Student can cancel a Committed Booking and forfeits the Commitment Payment. A Photographer can cancel a Committed Booking, and the Student is refunded the Commitment Payment in full — for the case where the Photographer's payout share hasn't released yet.

**Blocked by:** 07 — Commitment Payment & Commission split, 08 — Payout hold & release

**Status:** ready-for-agent

- [ ] A Student can cancel a Committed Booking; the Commitment Payment (both Agency and Photographer shares) is retained, not refunded
- [ ] A Photographer can cancel a Committed Booking whose payout share has not yet released; the Student's Commitment Payment is refunded in full
- [ ] Cancelling a Booking transitions it to Cancelled and records who initiated the cancellation
- [ ] Time-Slot-reopening-on-cancellation is explicitly deferred — not required by this ticket, since the PRD doesn't specify that behavior
- [ ] A Photographer cancelling AFTER their payout share has already released is explicitly out of scope for this ticket (the clawback edge case flagged in the PRD's Further Notes) — this case must fail loudly rather than silently double-paying or corrupting state
