# 07 — Commitment Payment & Commission split

**What to build:** The moment a Photographer accepts a Booking Request, the Student pays the fixed RM30 Commitment Payment, which is immediately split between Photographer and Agency at the configured Commission rate (15% default).

**Blocked by:** 06 — Booking Request lifecycle

**Status:** ready-for-agent

- [ ] Accepting a Booking Request makes the RM30 Commitment Payment payable by the Student
- [ ] Paying the Commitment Payment transitions the Booking to Committed
- [ ] The Commitment Payment amount is split between Photographer and Agency according to the Commission rate
- [ ] The Commission rate is a configurable value, defaulting to 15%, not hardcoded per-transaction
- [ ] The Commitment Payment is recorded as a credit toward the Booking's total price, not an additive fee
