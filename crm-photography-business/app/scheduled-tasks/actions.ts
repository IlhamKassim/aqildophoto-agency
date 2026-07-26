"use server";

import { revalidatePath } from "next/cache";
import { getServices } from "../lib/services";
import type { Booking } from "../../src/booking-board";

/**
 * The two time-driven sweeps the domain layer exposes. In production a
 * scheduler would call them; until there is one, the operator runs them by
 * hand from this screen — which is also the only way to see what a run did.
 */
export const TASK_INTENTS = ["expire-stale-requests", "release-payouts"] as const;

export type TaskIntent = (typeof TASK_INTENTS)[number];

function isTaskIntent(value: string): value is TaskIntent {
  return (TASK_INTENTS as readonly string[]).includes(value);
}

/** One affected Booking, flattened for the client — Dates do not cross intact. */
export interface AffectedBooking {
  id: string;
  studentId: string;
  detail: string;
}

export interface TaskRunState {
  error?: string;
  /** Absent until the task has been run at least once in this session. */
  ranAt?: string;
  affected?: AffectedBooking[];
}

const DETAIL_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function describe(intent: TaskIntent, booking: Booking): string {
  return intent === "expire-stale-requests"
    ? `requested ${DETAIL_TIME.format(booking.requestedAt)}, deadline passed ${DETAIL_TIME.format(booking.expiresAt)}`
    : `payout released ${booking.payoutReleasedAt ? DETAIL_TIME.format(booking.payoutReleasedAt) : "now"}`;
}

export async function runScheduledTaskAction(
  _previous: TaskRunState,
  formData: FormData,
): Promise<TaskRunState> {
  const intent = String(formData.get("intent") ?? "");
  if (!isTaskIntent(intent)) {
    return { error: "Unrecognised scheduled task." };
  }

  // One `now` for the whole run, so the sweep and the report agree on it.
  const now = new Date();

  try {
    const bookings = getServices().bookings;
    const affected =
      intent === "expire-stale-requests"
        ? bookings.expireStaleBookingRequests(now)
        : bookings.releaseEligiblePayouts(now);

    // An empty sweep is a normal outcome, not a failure: `affected: []` is what
    // tells the runner to report "nothing was eligible" rather than an error.
    return {
      ranAt: now.toISOString(),
      affected: affected.map((booking) => ({
        id: booking.id,
        studentId: booking.studentId,
        detail: describe(intent, booking),
      })),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    // Both sweeps change Booking state the other screens render.
    revalidatePath("/scheduled-tasks");
    revalidatePath("/bookings");
    revalidatePath("/");
  }
}
