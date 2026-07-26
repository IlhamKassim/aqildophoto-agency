"use server";

import { revalidatePath } from "next/cache";
import { getServices } from "../lib/services";

export interface ActionState {
  error?: string;
  success?: string;
}

const FIELDS = ["university", "faculty", "date", "venue"] as const;

const LABELS: Record<(typeof FIELDS)[number], string> = {
  university: "University",
  faculty: "Faculty",
  date: "Date",
  venue: "Venue",
};

/** `<input type="date">` submits `YYYY-MM-DD`. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function createConvocationEventAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()]),
  ) as Record<(typeof FIELDS)[number], string>;

  const missing = FIELDS.filter((field) => !values[field]);
  if (missing.length > 0) {
    return { error: `${missing.map((f) => LABELS[f]).join(", ")} required.` };
  }

  if (!DATE_PATTERN.test(values.date)) {
    return { error: "Date must be a valid calendar date." };
  }

  // Parse as local midnight, not UTC: `new Date("2026-08-01")` is UTC midnight,
  // which renders as the previous day for operators west of Greenwich.
  const date = new Date(`${values.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { error: "Date must be a valid calendar date." };
  }

  try {
    const event = getServices().convocationEvents.createConvocationEvent({
      university: values.university,
      faculty: values.faculty,
      date,
      venue: values.venue,
    });
    return {
      success: `${event.university} — ${event.faculty} created.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    // Drop the cached render so the new event appears without a manual refresh.
    revalidatePath("/convocation-events");
    revalidatePath("/");
  }
}
