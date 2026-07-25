"use server";

import { revalidatePath } from "next/cache";
import { getServices } from "../lib/services";

export interface ActionState {
  error?: string;
  success?: string;
}

/**
 * The domain layer throws on invalid transitions (e.g. approving a
 * Photographer who is not Pending). Ticket 08 requires those errors reach the
 * operator rather than being swallowed or escalated to the error overlay, so
 * every action converts a throw into returned state.
 */
function run(fn: () => string): ActionState {
  try {
    return { success: fn() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    // Revalidate on failure too. A rejected transition usually means the
    // operator's view is stale (another tab already acted), so leaving the old
    // rows on screen would contradict the error message they just read.
    revalidatePath("/photographers");
  }
}

export async function registerPhotographerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Name is required." };
  }

  return run(() => {
    const photographer = getServices().photographers.registerPhotographer({ name });
    return `${photographer.name} registered as Pending.`;
  });
}

/**
 * Approve and reject share one action so their state can be owned by a single
 * component above the table. Per-row state would be destroyed when the action
 * removes the row it was dispatched from — see the note in `feedback.tsx`.
 */
export async function reviewPhotographerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("photographerId") ?? "");
  const intent = String(formData.get("intent") ?? "");

  if (intent !== "approve" && intent !== "reject") {
    return { error: `Unknown action "${intent}".` };
  }

  return run(() => {
    const registry = getServices().photographers;
    if (intent === "approve") {
      return `${registry.approvePhotographer(id).name} approved.`;
    }
    return `${registry.rejectPhotographer(id).name} rejected.`;
  });
}
