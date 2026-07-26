# 10 — Photographer detail screen

**What to build:** The Agency operator can, for a single Photographer, manage their Packages and Add-ons, opt them into a Convocation Event, and define Time Slots for an event they've opted into.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** done

- [x] The screen shows a single Photographer's existing Packages, each with its Add-ons
- [x] A form creates a new Package (name, price, description) for this Photographer
- [x] A form adds an Add-on (name, price) to an existing Package
- [x] A control opts this Photographer into a chosen Convocation Event
- [x] A form defines a Time Slot (start/end) for this Photographer within an event they've opted into
- [x] The screen shows this Photographer's open Time Slots per event
- [x] Errors thrown by the domain layer are surfaced to the operator

## Comments

Implemented at `app/photographers/[id]/` (page, four forms across two client
modules, one server-action module, CSS module). The Photographers table now
links each name through to this screen.

Notes on decisions taken while building:

- **No domain-layer changes.** `PhotographerRegistry` has no single-Photographer
  getter, so the page filters `listAllPhotographers()`; the roster is
  operator-sized. Opted-in events are derived by checking each upcoming event's
  `listOptedInPhotographerIds`, since there is no inverse query.
- **Feedback is per-form, not page-level.** Unlike the Photographers table,
  where approving a row destroys the row that dispatched the action, every form
  here stays mounted across its own submission — so each owns its action state
  and reports next to itself.
  - One exception found in testing: opting into the *last* remaining event
    empties the select's options. A banner rendered inside that branch was
    unmounted by the very action that wrote it, so the operator saw no
    confirmation. The banner is now rendered above the branch.
- **Unapproved Photographers are gated in the UI.** The domain layer throws for
  Packages and opt-ins unless the Photographer is Approved, so the screen states
  the precondition per section instead of offering forms that cannot succeed.
- **Only upcoming events are shown.** An opt-in to a past ceremony is history,
  and the registry offers no way to list past events.

Verified in a browser against a throwaway SQLite file: created a Package
(RM 300.00), added an Add-on (RM 50.00), opted into an event, added a Time Slot
(09:00–09:30, local time preserved), and confirmed the end-before-start error
renders in the inline `role="alert"` banner. The pending-Photographer page shows
both gating messages and no forms. `npm run build` clean, 65/65 tests pass.

Two bugs were found and fixed by looking at the rendered screen rather than the
build output — both invisible to TypeScript and the test suite:

1. `.field { flex: 1 1 10rem }` applied to the stacked form too, stretching every
   field and opening large gaps between labels. Now scoped to `.formRow`.
2. The opt-in banner unmount described above.

### Follow-ups (not done — out of scope for this ticket)

- ~~**CSS duplication.**~~ Done — extracted to `app/shared.module.css`, which
  the three screen modules pull in via `composes`. Screens keep their own class
  names, so no component changed. Tickets 11 and 12 should compose from there
  rather than starting a fourth copy.
- **`datetime-local` values are lost on a failed submit.** The re-render clears
  the uncontrolled inputs, so the operator retypes both times after an error.
  Fixable by echoing submitted values back through the action state.
