# 10 — Photographer detail screen

**What to build:** The Agency operator can, for a single Photographer, manage their Packages and Add-ons, opt them into a Convocation Event, and define Time Slots for an event they've opted into.

**Blocked by:** 07 — Next.js scaffold + service wiring

**Status:** ready-for-agent

- [ ] The screen shows a single Photographer's existing Packages, each with its Add-ons
- [ ] A form creates a new Package (name, price, description) for this Photographer
- [ ] A form adds an Add-on (name, price) to an existing Package
- [ ] A control opts this Photographer into a chosen Convocation Event
- [ ] A form defines a Time Slot (start/end) for this Photographer within an event they've opted into
- [ ] The screen shows this Photographer's open Time Slots per event
- [ ] Errors thrown by the domain layer (e.g. defining a Time Slot for an event not opted into) are surfaced to the operator
