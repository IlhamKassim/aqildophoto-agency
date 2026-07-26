# 09 — Convocation Events screen

**What to build:** The Agency operator can view all upcoming Convocation Events and create a new one.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** done

- [x] The screen lists upcoming Convocation Events (university, faculty, date, venue)
- [x] A form creates a new Convocation Event with those fields
- [x] The list reflects a newly created event immediately (no manual refresh required)

## Comments

Implemented at `app/convocation-events/` (page, create form, server action, CSS
module), plus nav and home-page links.

Notes on decisions taken while building:

- The list measures "upcoming" from local start-of-today rather than from
  `new Date()`. `listUpcomingConvocationEvents` defaults to the current instant,
  which would drop a ceremony the operator just created for today — it would
  look like the create silently failed.
- `<input type="date">` submits `YYYY-MM-DD`, which `new Date()` parses as UTC
  midnight and renders as the previous day west of Greenwich. The action parses
  `${date}T00:00:00` so the stored day matches the day the operator picked.
- The create form owns its own action state and never unmounts, so no shared
  feedback provider was needed here (contrast Photographers, where approve/reject
  destroys the row it was dispatched from).

Verified in a browser against a throwaway SQLite file: creating an event moved
the count 0 → 1, showed the success banner, cleared the form and returned focus,
and the new row appeared with the correct local date. `npm run build` clean,
65/65 tests pass.
