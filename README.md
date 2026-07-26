# Aqildo Photo — Convocation Photography CRM

A CRM for a convocation (graduation ceremony) photography agency. The business itself is called **the Agency** throughout this codebase — that and every other domain term is defined in [`CONTEXT.md`](CONTEXT.md), which is the source of truth for language. The application lives in [`crm-photography-business/`](crm-photography-business/).

> ## ⚠️ Localhost only — never deploy this
>
> The admin console has **no authentication, no accounts, and no access control**, by deliberate decision ([ADR-0002](docs/adr/0002-personal-admin-console-before-marketplace.md)). Anyone who can reach it can approve Photographers, cancel Bookings, and read payment data and real Student names.
>
> Do not deploy it, expose it to the internet, bind it to a public interface, or put it behind a tunnel. Treat this as a hard rule, not a preference. Auth is deferred, not accidentally missing.

## What exists today

Two layers, one repo:

- **A domain layer** (`crm-photography-business/src/`) — all business rules for the marketplace: Photographer vetting, Convocation Events, Packages and Add-ons, Time Slots, the Booking lifecycle, the two-stage payment split, payout holds, and Delivery gating. Framework-independent, synchronous, and covered by 65 tests.
- **A personal-use admin console** (`crm-photography-business/app/`) — a Next.js App Router UI over that domain layer, persisting to SQLite, run only on the operator's own machine.

The console is explicitly **transitional**. The public self-serve marketplace (Students and Photographers using the platform directly) is not built. Students and Photographers still coordinate with the Agency by hand over WhatsApp, and payments are collected manually by bank transfer / DuitNow QR and then *recorded* here as facts. There is no payment processor integration.

## Current state

The domain layer and its SQLite persistence are complete. Of the five planned console screens, **Photographers** (list, register, approve/reject) is built; **Convocation Events**, **Photographer detail**, **Bookings**, and **Scheduled Tasks** are not.

This paragraph may lag reality. The authoritative record is the `Status:` field in each ticket under [`.scratch/admin-console/issues/`](.scratch/admin-console/issues/) — read those before picking up work.

## Running it

All commands run from inside the app directory:

```sh
cd crm-photography-business
npm install
npm run dev          # http://localhost:3000
```

`npm install` builds `better-sqlite3` from source, so a working native toolchain is required.

Other scripts:

```sh
npm test             # vitest, single run
npm run test:watch   # vitest, watch mode
npm run build        # production build
npm start            # serve the production build (still localhost only)
```

### The database

State lives in a single SQLite file, created on first use and gitignored:

```
crm-photography-business/admin-console.sqlite3
```

Point at a different file with the `ADMIN_CONSOLE_DB_PATH` environment variable:

```sh
ADMIN_CONSOLE_DB_PATH=./scratch.sqlite3 npm run dev
```

Schema is created idempotently (`CREATE TABLE IF NOT EXISTS`) on open, so a fresh path just works. There is **no seed data** — a new database starts completely empty, and there are no migrations, so a schema change means recreating the file.

To start clean, delete the file:

```sh
rm crm-photography-business/admin-console.sqlite3
```

That destroys all recorded Bookings and payments. See [Known gaps](#known-gaps) before doing it against real data.

### Nothing happens on a schedule

Two lifecycle operations that would be background jobs in a real deployment only ever run when a human triggers them:

- **`expireStaleBookingRequests`** — a Booking Request past its response deadline (default 48h) stays `Requested` forever, and its Time Slot stays locked, until this runs.
- **`releaseEligiblePayouts`** — a Photographer's held share of a Commitment Payment is never released until this runs.

The Scheduled Tasks screen that exposes these as buttons is **not built yet** (ticket 12), so today there is no way to trigger them from the UI at all.

## Architecture

```
CONTEXT.md                  Domain glossary — source of truth for language
docs/adr/                   Architectural decisions and their rationale
docs/agents/                Conventions for agents working in this repo
.scratch/<feature>/         PRDs and tickets per feature
crm-photography-business/
  src/                      Domain layer + its tests (framework-independent)
  app/                      Next.js App Router UI
    lib/services.ts         Opens the DB, builds the singleton service graph
```

The domain layer is six modules, composed in `src/services.ts`:

| Module | Responsibility |
| --- | --- |
| `PhotographerRegistry` | Photographers and their Pending/Approved/Rejected status |
| `ConvocationEventRegistry` | Convocation Events (manual entry only) |
| `PackageCatalog` | Packages and Add-ons, gated on Approved Photographers |
| `TimeSlotBoard` | Event opt-ins and the Time Slots within them |
| `BookingBoard` | The Booking lifecycle, payments, splits, payout holds, Delivery |
| `AgencyDashboard` | Read-only rollups across Bookings and Photographers |

A seventh module, `MarketplaceBrowser`, exists and is tested but is **not** wired into `Services` — it serves the Student-facing browsing use case, which is out of scope for an operator-only console.

Two structural properties are load-bearing and worth not breaking accidentally:

- **Every domain method is synchronous.** `better-sqlite3` was chosen over an ORM specifically to keep it that way, so the existing tests never needed rewriting to `async`/`await` ([ADR-0002](docs/adr/0002-personal-admin-console-before-marketplace.md)).
- **Services are a per-process singleton** cached on `globalThis` (`app/lib/services.ts`), which is only safe because this runs as one long-lived local process. It would break under serverless or multi-instance hosting — another reason the deployment ban above is structural, not only about auth.

Business rules live in the domain layer, which throws on invalid transitions. Pages and Server Actions stay thin: call the right method, render the result or the error.

## Working in this repo

- **[`CLAUDE.md`](CLAUDE.md)** — agent instructions, including the per-commit git authorship convention this repo requires.
- **[`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)** — how specs and tickets under `.scratch/` are structured.
- **[`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)** — the label set (`needs-triage`, `ready-for-agent`, `ready-for-human`, …).
- **[`docs/agents/domain.md`](docs/agents/domain.md)** — how `CONTEXT.md` and ADRs are maintained.

Specs, for behaviour questions this README doesn't answer:

- **[`.scratch/crm-base/PRD.md`](.scratch/crm-base/PRD.md)** — the full marketplace: 36 user stories, the Booking lifecycle, payment and cancellation rules.
- **[`.scratch/admin-console/PRD.md`](.scratch/admin-console/PRD.md)** — the operator console: the five screens and what each does.

### Testing convention

Tests exercise the domain modules' **public methods only**, asserting on returned state — not internals. Persistence tests run against an in-memory `:memory:` database. The Next.js UI layer has **no automated tests** by deliberate scope decision; screens are verified by running the app. Keep new work on the same seam unless there's a documented reason to change it.

### Decisions worth reading before changing behaviour

- **[ADR-0001](docs/adr/0001-two-stage-payment-flow.md)** — why payment is two-stage (a forfeitable RM30 Commitment Payment on acceptance, then a Final Payment gating Delivery) rather than one split charge at Booking, and why the Photographer's Commitment share is held rather than paid out immediately.
- **[ADR-0002](docs/adr/0002-personal-admin-console-before-marketplace.md)** — why a localhost admin console was built before the public marketplace, why SQLite without an ORM, and why this is transitional.

## Known gaps

Known and unresolved, recorded here so they aren't rediscovered the hard way:

- **No backup for real business data.** `admin-console.sqlite3` is the only copy of every Booking and payment record, it's gitignored, and no backup or export process exists. Losing the file or the machine loses the business's records.
- **Payout clawback is unresolved.** If a Photographer cancels *after* their held Commitment Payment share has already been released, refunding the Student becomes a clawback rather than a reversal. No mechanism handles this. Flagged in [`.scratch/crm-base/PRD.md`](.scratch/crm-base/PRD.md) under Further Notes; it needs a resolution before payout-release logic is trusted against real money.
- **No migrations.** Any schema change means recreating the database file — fine now, not fine once real data accumulates.
- **The console is transitional by design.** Neither the SQLite schema nor the admin UI is expected to survive the public marketplace build unchanged.

## Licence

MIT — see [`LICENSE`](LICENSE).
