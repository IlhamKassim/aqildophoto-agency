"use server";

import { revalidatePath } from "next/cache";
import { getServices } from "../lib/services";

export interface ActionState {
  error?: string;
}

export async function dismissLeadAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("leadId") ?? "");

  try {
    getServices().convocationLeads.dismissLead(id);
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    // A rejected dismiss (unknown id) usually means the operator's view is
    // stale, so leaving the old row on screen would contradict the error.
    revalidatePath("/convocation-leads");
  }
}
