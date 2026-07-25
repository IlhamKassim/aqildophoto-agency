# 08 — Payout hold & release

**What to build:** The Photographer's share of the Commitment Payment is held in platform balance rather than paid out immediately, and is only released once the Convocation Event's date has passed without a Photographer-initiated cancellation on that Booking.

**Blocked by:** 07 — Commitment Payment & Commission split

**Status:** ready-for-agent

- [ ] The Photographer's share of a Commitment Payment split is held, not released, at the moment of payment
- [ ] A held share is released to the Photographer once the associated Convocation Event's date has passed
- [ ] A held share is NOT released if the Booking has a Photographer-initiated cancellation recorded against it before release
- [ ] Held/released state is queryable per Booking (for Agency visibility and future reconciliation)
