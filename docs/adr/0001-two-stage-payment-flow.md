---
status: accepted
---

# Two-stage payment: Commitment Payment + Final Payment

We initially planned a single payment split automatically at the moment of Booking (Stripe Connect–style: Student pays once, funds instantly divide between Photographer and Agency). We changed this to a two-stage flow: a fixed RM30 Commitment Payment once the Photographer accepts a Booking Request, followed by a Final Payment (the remaining balance) once the Photographer marks photos ready for Delivery. Both payments split by the same Commission rate.

We made this change because a single up-front charge doesn't fit a request-to-book workflow — charging before the Photographer has even accepted would mean holding funds against an unconfirmed match. The two-stage structure also gives the Commitment Payment a real purpose (a forfeitable deposit that filters out non-serious Students before a Photographer commits their time) and ties the Final Payment to actual value delivered (edited photos ready), rather than to the Convocation Event date passing.

## Consequences

- The Commitment Payment is forfeited if the Student cancels, but refunded if the Photographer cancels or fails to deliver — this asymmetry needs to be enforced wherever cancellation is handled.
- Delivery access (the external photo link) is gated on Final Payment, not on the event happening — a Photographer could finish editing quickly, or take a long time; there's no fixed SLA modeled yet.
- Commission is realized in two separate payout events per Booking rather than one, which the payment integration needs to support natively (not just a single split).
- The Photographer's share of the Commitment Payment is held rather than paid out instantly — it releases only after the Convocation Event date passes without a Photographer-initiated cancellation. This avoids a clawback scenario where a cancellation refund would otherwise require recovering funds already paid out (standard Stripe Connect guidance for marketplaces with refund risk).
