# 11 — Bookings screen

**What to build:** The Agency operator can see every Booking with its current lifecycle status, record a new Booking Request, and drive it through its full lifecycle (accept/reject, pay Commitment, cancel, mark photos ready, pay Final Payment) via actions scoped to what's valid for its current state.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** ready-for-agent

- [ ] The screen lists all Bookings with their current status (Requested, Accepted, Rejected, Expired, Committed, Cancelled, AwaitingFinalPayment, Delivered)
- [ ] A form records a new Booking Request (Student identifier, Time Slot, Package, Add-ons)
- [ ] A Requested Booking shows Accept and Reject actions
- [ ] An Accepted Booking shows a "record Commitment Payment paid" action, after which the Commission split is visible
- [ ] A Committed Booking shows Student-cancel and Photographer-cancel actions, and a "mark photos ready" action requiring a Delivery link
- [ ] An AwaitingFinalPayment Booking shows a "record Final Payment paid" action, after which the Delivery link and Final Payment Commission split are visible
- [ ] Only actions valid for a Booking's current status are shown; invalid actions are not exposed
- [ ] Errors thrown by the domain layer are surfaced to the operator, not silently swallowed
