# CRM Base — Photography Convocation Agency Marketplace

Status: ready-for-agent

## Problem Statement

Students graduating need convocation (graduation ceremony) photography, but the Agency currently has no way to connect them with vetted Photographers, manage per-ceremony availability, or move money safely between two parties who've never dealt with each other before. Today none of this exists: Photographers can't be vetted or listed, Students can't browse or book, and there's no mechanism to collect and split payment for a Booking without either side risking being burned — a Student paying and the Photographer flaking, or a Photographer shooting an event and never getting paid.

## Solution

Build a base marketplace CRM where: the Agency vets and Approves Photographers before they can list; Photographers publish fixed-price Packages and Add-ons and opt in to specific Convocation Events with defined Time Slots; Students self-serve browse and request a Time Slot; Photographers accept or reject each Booking Request within a response deadline; an accepted Booking collects a fixed RM30 Commitment Payment (split by Commission) that's forfeited if the Student cancels and refunded if the Photographer cancels; the remaining Final Payment becomes due once the Photographer marks photos ready, gating the Student's access to an externally-hosted Delivery link; and the Photographer's payout on the Commitment Payment is held until the Convocation Event date passes, to avoid a clawback if a late cancellation happens.

## User Stories

1. As a prospective Photographer, I want to submit my profile and portfolio for review, so that I can be considered for approval onto the platform.
2. As Agency staff, I want to review a Photographer's submitted profile, so that I can Approve or Reject them before they can list on the platform.
3. As Agency staff, I want to reject a Photographer's application, so that unqualified or unverified Photographers never reach Students.
4. As an Approved Photographer, I want to create a Package with a fixed price and description, so that Students know exactly what they're paying for upfront.
5. As an Approved Photographer, I want to add optional Add-ons to my Packages, so that Students can customize their shoot with extras like an extra hour or an outfit change.
6. As Agency staff, I want to manually create a Convocation Event with a university, faculty, date, and venue, so that Students and Photographers have a shared, canonical event to book against.
7. As an Approved Photographer, I want to browse upcoming Convocation Events, so that I can decide which ceremonies I want to work.
8. As an Approved Photographer, I want to opt in to a specific Convocation Event, so that I become bookable for that ceremony.
9. As an Approved Photographer, I want to define discrete Time Slots within a Convocation Event I've opted into, so that Students can book a specific window of my day.
10. As a Student, I want to browse Convocation Events, so that I can find the one relevant to my graduation ceremony.
11. As a Student, I want to browse Approved Photographers and their Packages for a specific Convocation Event, so that I can compare options and choose one that fits my budget and style.
12. As a Student, I want to select an open Time Slot along with a Package and any Add-ons, so that I can request a Booking.
13. As a Student, I want to submit a Booking Request for a Time Slot, so that the Photographer can decide whether to accept me.
14. As a Student, I want my requested Time Slot locked from other Students immediately on request, so that I'm not competing with someone else for the same slot while I wait for a response.
15. As a Photographer, I want to see incoming Booking Requests for my Time Slots, so that I can decide whether to accept or reject each one.
16. As a Photographer, I want to accept a Booking Request, so that the Booking becomes active and payment can proceed.
17. As a Photographer, I want to reject a Booking Request, so that the Time Slot reopens for other Students without any money changing hands.
18. As a Student, I want my Booking Request to auto-expire if the Photographer doesn't respond within the response deadline, so that I'm not left waiting indefinitely and can request a different slot.
19. As a Student, I want to pay the RM30 Commitment Payment immediately once my Booking Request is accepted, so that my Booking is confirmed.
20. As the Agency, I want the Commitment Payment to automatically split between the Photographer and the Agency at the Commission rate, so that Commission is realized without manual invoicing.
21. As the Agency, I want the Photographer's share of the Commitment Payment held in platform balance rather than paid out instantly, so that a later refund doesn't require clawing back funds already sent.
22. As the Agency, I want to release the Photographer's held Commitment Payment share once the Convocation Event date passes without a Photographer-initiated cancellation, so that Photographers are paid promptly once the risk window closes.
23. As a Student, I want to cancel my Booking after paying the Commitment Payment, so that I have an exit if my plans change.
24. As a Student, I want to understand upfront that cancelling forfeits my RM30 Commitment Payment, so that I'm not surprised by the policy.
25. As a Photographer, I want to cancel a Booking I previously accepted, so that I can back out if I'm no longer able to make the event.
26. As a Student, I want my Commitment Payment refunded in full if the Photographer cancels the Booking, so that I'm not penalized for their failure to follow through.
27. As a Photographer, I want to mark a Booking's photos as ready for delivery, so that the Final Payment becomes due and the Student can pay.
28. As a Student, I want to be notified when my Final Payment is due, so that I know when and how much to pay.
29. As a Student, I want to pay the Final Payment (total minus the already-paid Commitment Payment), so that I can receive my photos.
30. As the Agency, I want the Final Payment to split by the same Commission rate as the Commitment Payment, so that Commission is applied consistently across both payments.
31. As a Student, I want to receive the Delivery link only after my Final Payment clears, so that Photographers aren't giving away completed work unpaid.
32. As a Photographer, I want to provide an external link (e.g. Google Drive) as the Delivery mechanism, so that I don't need to upload photos into the platform itself.
33. As Agency staff, I want to see all Bookings and their current lifecycle state, so that I can track the health of the marketplace and intervene if something stalls.
34. As Agency staff, I want to see each Photographer's approval status (Pending, Approved, Rejected), so that I can manage the roster.
35. As the Agency, I want the Commission rate to be configurable (starting at a flat 15%), so that pricing can be adjusted as the business matures without a code change.
36. As a Student, I want to see the total price (Package + Add-ons) and how much is due now vs. later before I submit a Booking Request, so that I can budget for both the Commitment Payment and Final Payment.

## Implementation Decisions

- A single domain/application-service layer encapsulates all business rules, independent of any specific web framework, database, or UI layer. Suggested use-case operations: `registerPhotographer`, `reviewPhotographerApplication` (approve/reject), `createPackage`, `createAddOn`, `createConvocationEvent` (admin), `optInToConvocationEvent`, `defineTimeSlot`, `requestBooking`, `respondToBookingRequest` (accept/reject), `expireStaleBookingRequests`, `payCommitmentPayment`, `cancelBooking` (Student-initiated and Photographer-initiated variants), `markPhotosReady`, `payFinalPayment`, `releaseHeldPayout`.
- Entities/aggregates: Photographer (with Photographer Status: Pending/Approved/Rejected), Student, Package, Add-on, Convocation Event, Time Slot (belongs to a Photographer's opt-in for a specific Convocation Event), Booking (aggregate root tying Student + Photographer + Time Slot + Package + Add-ons + payment state + lifecycle status).
- Booking lifecycle: Requested → (Accepted | Rejected | Expired) → Committed (after Commitment Payment) → AwaitingFinalPayment (after Photographer marks ready) → Delivered (after Final Payment). Cancelled can branch off Accepted/Committed/AwaitingFinalPayment depending on who cancels.
- Time Slot locking: a Time Slot moves to "held" the instant a Booking Request is created against it, and back to "open" on rejection or expiry. Only one active Booking Request or Booking may reference a Time Slot at a time.
- Booking Request response deadline: configurable, defaulting to 48 hours. A scheduled/background process (mechanism unspecified — cron, queue, or equivalent) transitions expired requests and reopens their Time Slot.
- Payment split: both Commitment Payment and Final Payment split by the same Commission rate (flat 15% for v1, configurable). The payment processor must support per-transaction split payouts to two parties (Photographer, Agency) — e.g. Stripe Connect or equivalent.
- Payout hold: the Photographer's share of the Commitment Payment is held in platform balance (not released to their connected account) until the Convocation Event's date passes without a Photographer-initiated cancellation recorded against that Booking.
- Cancellation asymmetry: Student-initiated cancellation after Commitment Payment forfeits the RM30 (both the Agency's and Photographer's shares are retained, subject to the same payout hold/release timing for the Photographer's share). Photographer-initiated cancellation triggers a full refund of the Commitment Payment to the Student.
- Delivery: the system stores a Photographer-provided external link (e.g. Google Drive) per Booking; the link is only exposed to the Student once Final Payment is confirmed. The system does not host photo files itself.
- Photographer Status is a first-class field; only Approved Photographers may opt into a Convocation Event or list Packages/Add-ons publicly.
- Convocation Events are created via manual Agency admin entry only — no import/scrape integration in scope.

## Testing Decisions

- Tests exercise the domain/application-service layer's public use-case functions only, asserting on resulting state/events (e.g. Booking status transitions, payment split amounts, Time Slot availability) rather than internal implementation details — no framework, database, or UI coupling in the test seam.
- This is a greenfield codebase, so there is no prior art to follow yet — this spec establishes the project's first testing convention. Later specs should follow the same seam unless a documented reason requires a new one.
- Priority coverage: Booking lifecycle state transitions (including the Requested→Expired path and both cancellation branches), payment split correctness (Commitment + Final, both at the Commission rate), Time Slot locking/reopening behavior, and Delivery-link gating on Final Payment.
- Photographer approval gating (Pending/Rejected Photographers cannot opt into events or appear to Students) is tested as a business-rule boundary in the domain layer, not as a UI-level check.

## Out of Scope

- Any specific frontend framework, backend framework, database technology, or payment processor selection — this spec defines behavior, not the stack.
- Manual/Agency-curated matchmaking fallback (raised as a possible future pivot during design, explicitly not part of this build).
- Convocation Event import/scraping from university calendars — manual entry only.
- In-platform photo hosting/storage — Delivery is external-link-based only.
- Ratings/reviews, dispute resolution beyond the basic cancellation refund rules, and multi-currency support.
- Notification delivery mechanism (email/SMS/push) — stories reference "being notified" but the channel is unspecified.
- Tiered/notice-window cancellation refunds — flat forfeiture only, per research finding that photography-industry norms favor this over the multi-day-rental-style tiering used by other marketplace categories.

## Further Notes

- Open edge case, not yet resolved: if a Photographer cancels *after* their Commitment Payment share has already been released (payout hold window has passed), the refund to the Student becomes a clawback rather than a simple reversal. This needs a resolution — e.g. extending the hold window, or an explicit clawback/negative-balance mechanism — before payout release logic is implemented.
- Commission rate (15%) and Commitment Payment amount (RM30) are current business decisions, not derived from per-Photographer or per-Package negotiation. See `CONTEXT.md` and `docs/adr/0001-two-stage-payment-flow.md`, which remain the source of truth for terminology and rationale.
