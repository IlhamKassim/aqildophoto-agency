# Photography Convocation Agency

A marketplace agency that recruits freelance photographers and lets students book them directly for convocation (graduation ceremony) photography, taking a commission on each booking.

## Language

**Photographer**:
A freelance photographer recruited onto the platform. Lists Packages and Add-ons, and opts in to specific Convocation Events they're available to shoot. Must hold an Approved status to opt into any Convocation Event.

**Photographer Status**:
The vetting state of a Photographer's account: Pending (submitted profile, awaiting Agency review), Approved (may opt into Convocation Events and receive Bookings), or Rejected. A formal, system-tracked state rather than an off-platform decision.

**Student**:
The paying customer. Independently browses Photographer profiles and Packages and books directly — the Agency does not manually match Students to Photographers (v1).
_Avoid_: Client, customer (use Student for clarity against Photographer)

**Agency**:
The business itself. Recruits and vets Photographers, facilitates the Student-Photographer Booking, and takes a commission/percentage of each Booking. Not a manual matchmaker in the current model.

**Package**:
A fixed-price offering listed by a Photographer (e.g. "Basic – RM300 – 2hrs, 30 edited photos"). Price is known upfront, since it determines both the Commitment Payment and Final Payment amounts. Price is always a positive amount — a free or negatively-priced Package is not a valid offering.

**Add-on**:
An optional, fixed-price extra a Student selects alongside a Package at Booking time (e.g. extra hour, extra outfit change, rush editing). Combines with the Package price to form the total charged. Price is always a positive amount, same as a Package.

**Convocation Event**:
A specific graduation ceremony session (e.g. "UM Faculty of Engineering — Convocation Session 3 — 14 Oct 2026"), maintained as a first-class entity rather than free-text on a Booking. Students select which Convocation Event they're booking for. Maintained via manual admin entry by Agency staff, not imported from an external source.

**Convocation Lead**:
An externally-sourced, unconfirmed graduation ceremony scraped from a Malaysian university's own website — tracked before the Agency has committed to pursuing it. Coarser than a Convocation Event: carries university and date (faculty is not required, since it's rarely published this early), with venue if available. Purely informational for the Agency operator's own sourcing/planning; there is no conversion action linking a Convocation Lead to the Convocation Event an operator may later create by hand if they decide to pursue it. An operator can dismiss a Lead they're not pursuing, so it stops appearing without deleting the record.
_Avoid_: Convocation Event (a Lead is not onboarded/committed; an Event is)

**IPTA** (Institusi Pendidikan Tinggi Awam):
Malaysia's public universities — government-funded, degree-granting institutions (e.g. Universiti Malaya, Universiti Malaysia Sarawak). The Convocation Lead scraper's initial sources are drawn from this list; see `scraper-sources.ts`'s `UNIMPLEMENTED_IPTA_UNIVERSITIES` for the ones not yet implemented.

**IPTS** (Institusi Pendidikan Tinggi Swasta):
Malaysia's private universities and university colleges — degree-granting, privately funded institutions with their own convocation ceremonies (e.g. Taylor's, UCSI, INTI). Scoped to universities and university colleges only — a private college or campus without full university-college status is not an IPTS for Convocation Lead sourcing purposes, since it wouldn't hold its own convocation ceremony. One IPTS source is implemented so far (Universiti Teknologi Petronas — see `utp-convocation-source.ts`); see `scraper-sources.ts`'s `UNCONFIRMED_IPTS_UNIVERSITIES` for the (larger) list of candidates checked and found not currently viable.
_Avoid_: conflating with IPTA (public) — the two are sourced and tracked as separate candidate lists

**Photographer availability**:
A Photographer must explicitly opt in to a specific Convocation Event to be listed as bookable for it — general/passive calendar availability is not enough. No explicit capacity number in v1; availability is naturally limited by holding at most one Booking per time slot.

**Time Slot**:
A discrete, bookable window (e.g. 9:00–9:30) that a Photographer defines within a Convocation Event they've opted into. A Student books one open Time Slot; once booked, it's no longer available to other Students. Prevents double-booking by construction. The end always comes after the start — no minimum duration is enforced beyond that.

**Booking**:
A request-to-book agreement between a Student and a Photographer for a specific Time Slot within a Convocation Event, covering a chosen Package and any Add-ons. Created when a Student requests a Time Slot; only becomes active once the Photographer accepts.
_Avoid_: Order, appointment

**Booking Request**:
The Pending state of a Booking between when a Student requests a Time Slot and when the Photographer responds. Locks the Time Slot from other Students immediately on request. The Photographer must accept or reject within a response deadline (e.g. 48 hours); if they don't respond in time, the request auto-expires and the Time Slot reopens.

**Commitment Payment**:
A fixed RM30 payment the Student makes once the Photographer accepts their Booking request. Functions as a deposit — it is credited toward (deducted from) the Final Payment, not an additional fee. Splits between Photographer and Agency at the same commission rate as the Final Payment. Forfeited if the Student cancels the Booking; refunded if the Photographer cancels or fails to deliver.

**Final Payment**:
The remaining balance (Package + Add-ons total, minus the Commitment Payment) that becomes due once the Photographer marks the edited photos as ready for delivery — not simply once the Convocation Event date has passed. Delivery of photos is gated on this payment being made in full.

**Commission**:
The percentage of a Booking's total price (across both the Commitment Payment and Final Payment) that the Agency retains, with the remainder paid out to the Photographer. Set at a flat **15%** for v1, chosen as a Photographer-friendly starting rate against comparable marketplace benchmarks (Upwork 10%, Fiverr 20%, Thumbtack 15–30%) while the platform is new and still building its Photographer roster.

**Payout**:
The release of a Photographer's Commission-split earnings from platform balance to the Photographer. The Photographer's share of the Commitment Payment is held (not released) until the Convocation Event date has passed without a Photographer-initiated cancellation, so a later refund never requires clawing back funds already paid out.

**Delivery**:
The moment a Student gains access to their edited photos. The Photographer hosts the photos externally (e.g. Google Drive) and provides a link; the system reveals that link to the Student only once the Final Payment is confirmed. The system gates access to the link — it does not host the photo files itself.

## Example dialogue

> **Dev**: So when does money actually change hands?
> **Domain expert**: A Student sends a Booking Request for an open Time Slot. If the Photographer accepts, the Student immediately pays the RM30 Commitment Payment — that's split by Commission right away. Nothing else happens until the Photographer marks the photos ready.
> **Dev**: And that's when the rest gets charged?
> **Domain expert**: Right — the Final Payment is the total minus the RM30, and it's due the moment the Photographer says the photos are ready. Once that clears, the Student gets the Delivery link.
> **Dev**: What if the Photographer never responds to the request?
> **Domain expert**: The Booking Request auto-expires after the response deadline and the Time Slot reopens — no money was ever on the line at that point, since the Commitment Payment only happens after acceptance.
> **Dev**: And if the Student backs out after paying the deposit?
> **Domain expert**: They forfeit the RM30. If the Photographer backs out instead, it's refunded — the Student shouldn't be penalized for that.
