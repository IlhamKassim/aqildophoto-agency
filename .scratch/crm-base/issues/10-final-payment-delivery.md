# 10 — Final Payment & Delivery

**What to build:** A Photographer can mark a Committed Booking's photos as ready, which makes the Final Payment (total minus the Commitment Payment) due. Once the Student pays it — split by Commission — the Photographer-provided external Delivery link is released to the Student.

**Blocked by:** 07 — Commitment Payment & Commission split

**Status:** ready-for-agent

- [ ] A Photographer can mark a Committed Booking as photos-ready, transitioning it to AwaitingFinalPayment
- [ ] Marking photos-ready requires the Photographer to have provided an external Delivery link (e.g. a Google Drive URL) for that Booking
- [ ] The Final Payment amount equals the Package + Add-ons total minus the already-paid Commitment Payment
- [ ] Paying the Final Payment splits it between Photographer and Agency at the Commission rate
- [ ] Paying the Final Payment transitions the Booking to Delivered and exposes the Delivery link to the Student
- [ ] The Delivery link is NOT visible or accessible to the Student before the Final Payment is confirmed
