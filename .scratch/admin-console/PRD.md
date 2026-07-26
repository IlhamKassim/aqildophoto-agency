# Personal-Use Admin Console

Status: ready-for-agent

## Problem Statement

The Agency has a fully built and tested domain layer for the business (Photographer vetting, Convocation Events, Packages, Time Slots, Bookings, payments, Delivery), but no way to actually operate it — all state lives only in memory during a single test run and disappears immediately. There is no interface for the operator to register Photographers, create Convocation Events, track Bookings, or drive the payment/delivery lifecycle as real Photographers and Students start coordinating by hand. Building the full public marketplace (Students and Photographers self-serving) is a much larger undertaking the business can't yet justify before it has even started operating.

## Solution

Build a personal-use admin console: a Next.js app, running only on localhost with no authentication, that wraps the existing domain modules and persists their state in SQLite (via `better-sqlite3`, no ORM) so it survives restarts. The console gives the Agency operator five screens — Photographers, Convocation Events, Photographer detail (Packages/Add-ons/Time Slots), Bookings, and Scheduled Tasks — mapping directly onto the domain modules already built and tested. Students and Photographers continue to coordinate with the Agency by hand; this tool replaces manual bookkeeping with a real, persistent, clickable interface for the operator.

## User Stories

1. As the Agency operator, I want to register a new Photographer with their name, so that I can start the vetting process for someone I've recruited.
2. As the Agency operator, I want to see a list of all Photographers with their current status (Pending, Approved, Rejected), so that I know who needs review.
3. As the Agency operator, I want to approve a Pending Photographer, so that they can start listing Packages and opting into Convocation Events.
4. As the Agency operator, I want to reject a Pending Photographer, so that unqualified applicants don't proceed further.
5. As the Agency operator, I want to create a Convocation Event with university, faculty, date, and venue, so that Photographers and Bookings have a real ceremony to reference.
6. As the Agency operator, I want to see a list of upcoming Convocation Events, so that I know what's coming up and can plan around it.
7. As the Agency operator, I want to create a Package (name, price, description) for an Approved Photographer, so that Students (coordinated manually) know what they're paying for.
8. As the Agency operator, I want to add an Add-on to a Photographer's Package, so that optional extras are tracked with their own price.
9. As the Agency operator, I want to see a Photographer's existing Packages and Add-ons, so I don't have to remember what was already entered.
10. As the Agency operator, I want to opt a Photographer into a Convocation Event, so that they become eligible to define Time Slots for it.
11. As the Agency operator, I want to define a Time Slot (start/end time) for a Photographer within an event they've opted into, so that a specific Booking can later be recorded against it.
12. As the Agency operator, I want to see a Photographer's open Time Slots per event, so I know what's still available to offer.
13. As the Agency operator, I want to record a new Booking Request (Student, Time Slot, Package, Add-ons), so that a real coordination happening over WhatsApp is reflected in the system.
14. As the Agency operator, I want to see all Bookings with their current lifecycle status, so I have one place to track every in-flight booking.
15. As the Agency operator, I want to accept a Booking Request on the Photographer's behalf, so the Booking can proceed toward payment.
16. As the Agency operator, I want to reject a Booking Request, so the Time Slot reopens.
17. As the Agency operator, I want to record that the Commitment Payment was paid, so the Booking transitions to Committed and I can see the Commission split.
18. As the Agency operator, I want to cancel a Booking as the Student (forfeiting the Commitment Payment) or as the Photographer (refunding it), so the record matches what actually happened.
19. As the Agency operator, I want to mark a Booking's photos as ready with a Delivery link, so the Final Payment becomes trackable.
20. As the Agency operator, I want to record that the Final Payment was paid, so the Booking transitions to Delivered and I can see the Delivery link and Final Commission split.
21. As the Agency operator, I want to see a Booking's full payment history (Commitment and Final Payment amounts and splits), so I can reconcile what the Agency and each Photographer are owed.
22. As the Agency operator, I want to manually trigger expiration of stale Booking Requests, so Time Slots reopen even without a real background job running.
23. As the Agency operator, I want to manually trigger payout release for eligible Bookings, so Photographer payouts get marked released once their Convocation Event has passed.
24. As the Agency operator, I want to see which Bookings were affected by the last scheduled-task run, so I know it actually did something.
25. As the Agency operator, I want all my data to survive restarting the app, so that closing my laptop doesn't lose real business data.
26. As the Agency operator, I want the app to run entirely on my own machine, so that no sensitive business or payment data is exposed to the internet before real auth exists.

## Implementation Decisions

- Next.js (App Router), single project containing both the UI and the server-side logic (Server Actions / route handlers) that call the domain modules directly — no separate backend service.
- Persistence via SQLite through `better-sqlite3` directly (no ORM). This keeps every domain module method synchronous, matching the 57 existing tests without a rewrite to `async`/`await`. See ADR-0002.
- Each domain module's internal storage (currently a JS `Map`/array) is adapted to read/write through SQLite tables instead. The public method signatures — the existing seam — do not change.
- A single shared SQLite database file is opened once and wired into singleton instances of the 7 domain modules (`PhotographerRegistry`, `ConvocationEventRegistry`, `PackageCatalog`, `TimeSlotBoard`, `BookingBoard`, `MarketplaceBrowser`, `AgencyDashboard`), instantiated at server startup and reused across requests within the same Node process. This is acceptable because the app runs as a single long-lived `next dev`/`next start` process on localhost, not as a serverless or multi-instance deployment.
- Schema: one table per entity (Photographers, ConvocationEvents, Packages, AddOns, TimeSlots, Bookings), mirroring the existing TypeScript interfaces field-for-field. Only the relational constraints already implied by the domain layer's own lookups are needed (e.g. an AddOn references its Package's id).
- No authentication, no user accounts, no session management — the app is never deployed and is only ever reachable at localhost.
- Five screens: Photographers (list + register + approve/reject), Convocation Events (list + create), Photographer detail (Packages/Add-ons, opt-in, Time Slots), Bookings (list + full lifecycle actions), Scheduled Tasks (manual triggers for `expireStaleBookingRequests` and `releaseEligiblePayouts`).
- Next.js pages/Server Actions are kept intentionally thin — validation and business rules stay in the domain layer, which already throws on invalid transitions. The UI layer's job is to call the right method and display the result or error.
- Visual/UI design (component choice, layout, styling) is deferred to the `ui-ux-pro-max` skill once tickets reach the frontend screens — this spec defines behavior and structure, not visual design.

## Testing Decisions

- The existing seam is preserved: tests exercise the domain modules' public methods only, asserting on returned state — same style as the 57 existing tests.
- Adapting a module's internals to SQLite must keep all of that module's existing tests passing unchanged, aside from swapping the module's storage backend in test setup (e.g. an in-memory `:memory:` SQLite database instead of the class's previous default in-memory Maps).
- New tests are added only where SQLite persistence introduces genuinely new behavior beyond what the in-memory version had (e.g. "data survives re-instantiating the module against the same database file/connection").
- The Next.js UI layer (pages, Server Actions, components) is NOT covered by automated tests in this spec — verified by running the app manually. This is a deliberate scope decision given the personal-MVP context (see the "Testing Decisions" discussion in the originating conversation), not an oversight.

## Out of Scope

- Authentication, user accounts, sessions, or any access control.
- Deployment or hosting of any kind — localhost only.
- Real payment processor integration (Stripe Connect or otherwise) — payments continue to be recorded as facts after being collected manually (bank transfer/DuitNow QR), same as the existing domain layer already assumes.
- Real scheduled/background jobs (cron, queues) — `expireStaleBookingRequests` and `releaseEligiblePayouts` are triggered manually via a UI button.
- Student-facing or Photographer-facing views — this is an Agency-operator-only console.
- Automated UI/browser tests.
- Visual design specifics (colors, typography, component choices) — deferred to `ui-ux-pro-max` when building each frontend ticket.
- Data migration tooling — this is the first persistence layer this data has ever had.

## Further Notes

- This entire console is explicitly transitional (see `docs/adr/0002-personal-admin-console-before-marketplace.md`) — there is stated intent to improve or replace it once the public marketplace is built. The SQLite schema and admin UI are not guaranteed to survive that transition unchanged.
- Because there's no auth and the app will handle real payment and Student-name data, it must never be exposed beyond localhost in its current form — this constraint should be treated as a hard rule, not a suggestion, in any future ticket that touches deployment.
- `CONTEXT.md`, `docs/adr/0001-two-stage-payment-flow.md`, and `docs/adr/0002-personal-admin-console-before-marketplace.md` remain the source of truth for domain terminology and architectural rationale.
