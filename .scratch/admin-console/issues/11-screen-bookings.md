# 11 — Bookings screen

**What to build:** The Agency operator can see every Booking with its current lifecycle status, record a new Booking Request, and drive it through its full lifecycle (accept/reject, pay Commitment, cancel, mark photos ready, pay Final Payment) via actions scoped to what's valid for its current state.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** done

- [x] The screen lists all Bookings with their current status (Requested, Accepted, Rejected, Expired, Committed, Cancelled, AwaitingFinalPayment, Delivered)
- [x] A form records a new Booking Request (Student identifier, Time Slot, Package, Add-ons)
- [x] A Requested Booking shows Accept and Reject actions
- [x] An Accepted Booking shows a "record Commitment Payment paid" action, after which the Commission split is visible
- [x] A Committed Booking shows Student-cancel and Photographer-cancel actions, and a "mark photos ready" action requiring a Delivery link
- [x] An AwaitingFinalPayment Booking shows a "record Final Payment paid" action, after which the Delivery link and Final Payment Commission split are visible
- [x] Only actions valid for a Booking's current status are shown; invalid actions are not exposed
- [x] Errors thrown by the domain layer are surfaced to the operator, not silently swallowed
