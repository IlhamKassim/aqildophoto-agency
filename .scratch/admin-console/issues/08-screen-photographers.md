# 08 — Photographers screen

**What to build:** The Agency operator can view all Photographers with their status, register a new one, and approve or reject Pending ones, from a single screen.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** done

- [x] The screen lists all Photographers with their Photographer Status (Pending, Approved, Rejected)
- [x] A form registers a new Photographer, creating them as Pending
- [x] Pending Photographers have visible Approve and Reject actions that call the corresponding domain methods
- [x] The list reflects changes immediately after an action (no manual refresh required)
- [x] Errors thrown by the domain layer (e.g. approving a non-Pending Photographer) are surfaced to the operator, not silently swallowed

## Notes

- `app/globals.css` is the console-wide token foundation (colour, spacing, type)
  introduced by this ticket; screens 09–12 should build on it rather than adding
  page-local colours or spacing.
- Approve/reject action state deliberately lives in `FeedbackProvider`, above the
  table. Per-row state is destroyed when the action removes its own row, which
  silently swallowed domain errors — see the comment in `feedback.tsx`.
- Actions revalidate on failure as well as success, so a stale view corrects
  itself instead of contradicting the error the operator just read.

## Follow-ups

- **Reject has no confirmation and no undo.** `rejectPhotographer` is terminal —
  the domain throws on any later transition. A misclick permanently rejects a
  Photographer. Worth its own ticket (confirmation step or an un-reject path).
- The mobile (<640px) card layout is written but was not visually verified.
