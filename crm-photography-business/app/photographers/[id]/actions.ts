"use server";

import { revalidatePath } from "next/cache";
import { getServices } from "../../lib/services";

export interface ActionState {
  error?: string;
  success?: string;
}

/**
 * The domain layer throws on every rule it guards — creating a Package for an
 * unapproved Photographer, defining a Time Slot for an event that was never
 * opted into. Ticket 10 requires those messages reach the operator, so every
 * action converts a throw into returned state rather than letting it escalate
 * to the error overlay.
 */
function run(photographerId: string, fn: () => string): ActionState {
  try {
    return { success: fn() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    // Revalidate on failure too: a rejected write usually means this view is
    // stale, so leaving the old sections on screen would contradict the error.
    revalidatePath(`/photographers/${photographerId}`);
  }
}

/**
 * Prices are RM amounts stored as REAL. Only structural parsing happens here
 * — is this even a number — since the domain method's signature already
 * requires a `number`. Whether that number is a valid price (positive) is a
 * business rule `PackageCatalog` enforces itself.
 */
function parsePrice(raw: string, label: string): number | string {
  if (!raw) {
    return `${label} is required.`;
  }
  const price = Number(raw);
  if (!Number.isFinite(price)) {
    return `${label} must be a number.`;
  }
  return price;
}

export async function createPackageAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const photographerId = String(formData.get("photographerId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = parsePrice(String(formData.get("price") ?? "").trim(), "Price");

  if (!name) {
    return { error: "Package name is required." };
  }
  if (typeof price === "string") {
    return { error: price };
  }
  if (!description) {
    return { error: "Description is required." };
  }

  return run(photographerId, () => {
    const pkg = getServices().packages.createPackage(photographerId, {
      name,
      price,
      description,
    });
    return `Package "${pkg.name}" created.`;
  });
}

export async function addAddOnAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const photographerId = String(formData.get("photographerId") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = parsePrice(String(formData.get("price") ?? "").trim(), "Price");

  if (!name) {
    return { error: "Add-on name is required." };
  }
  if (typeof price === "string") {
    return { error: price };
  }

  return run(photographerId, () => {
    const addOn = getServices().packages.addAddOn(packageId, { name, price });
    return `Add-on "${addOn.name}" added.`;
  });
}

export async function optInAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const photographerId = String(formData.get("photographerId") ?? "");
  const convocationEventId = String(formData.get("convocationEventId") ?? "");

  if (!convocationEventId) {
    return { error: "Choose a Convocation Event to opt into." };
  }

  return run(photographerId, () => {
    const services = getServices();
    services.timeSlots.optIn(photographerId, convocationEventId);
    const event = services.convocationEvents
      .listUpcomingConvocationEvents()
      .find((candidate) => candidate.id === convocationEventId);
    return event
      ? `Opted in to ${event.university} — ${event.faculty}.`
      : "Opted in to the Convocation Event.";
  });
}

export async function defineTimeSlotAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const photographerId = String(formData.get("photographerId") ?? "");
  const convocationEventId = String(formData.get("convocationEventId") ?? "");
  const startRaw = String(formData.get("start") ?? "");
  const endRaw = String(formData.get("end") ?? "");

  if (!startRaw || !endRaw) {
    return { error: "Both a start and an end time are required." };
  }

  // `datetime-local` submits `YYYY-MM-DDTHH:mm` with no zone, which the Date
  // constructor reads as local time — the operator's own clock, which is what
  // they mean when they type a ceremony slot.
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Start and end must be valid times." };
  }
  // Ordering (end after start) is a business rule TimeSlotBoard enforces.

  return run(photographerId, () => {
    getServices().timeSlots.defineTimeSlot(photographerId, convocationEventId, {
      start,
      end,
    });
    return "Time Slot added.";
  });
}
