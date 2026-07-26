"use server";

import { revalidatePath } from "next/cache";
import { getServices } from "../lib/services";

export interface ActionState {
  error?: string;
  success?: string;
}

/**
 * Every lifecycle move the operator can make, and the domain call it maps to.
 *
 * The map is the single place that knows the vocabulary: `row-actions.tsx`
 * decides which intents a Booking's *current* status allows, this decides what
 * each intent does. Neither re-implements the other's rule — and an intent the
 * UI never offers still fails here, because the domain layer re-checks status.
 */
const LIFECYCLE_INTENTS = [
  "accept",
  "reject",
  "pay-commitment",
  "cancel-student",
  "cancel-photographer",
  "mark-photos-ready",
  "pay-final",
] as const;

export type LifecycleIntent = (typeof LIFECYCLE_INTENTS)[number];

function isLifecycleIntent(value: string): value is LifecycleIntent {
  return (LIFECYCLE_INTENTS as readonly string[]).includes(value);
}

/** Drop the cached renders that show Booking state, including the home counts. */
function revalidateBookingViews(): void {
  revalidatePath("/bookings");
  revalidatePath("/");
}

export async function requestBookingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const convocationEventId = String(formData.get("convocationEventId") ?? "");
  const timeSlotId = String(formData.get("timeSlotId") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  // Checkbox groups submit one entry per checked box, and nothing at all when
  // none are checked — `getAll` covers both without a special case.
  const addOnIds = formData.getAll("addOnIds").map(String).filter(Boolean);

  const missing = [
    ["Student identifier", studentId],
    ["Convocation Event", convocationEventId],
    ["Photographer time slot", timeSlotId],
    ["Package", packageId],
  ].filter(([, value]) => !value);
  if (missing.length > 0) {
    return { error: `${missing.map(([label]) => label).join(", ")} required.` };
  }

  try {
    const booking = getServices().bookings.requestBooking(
      studentId,
      timeSlotId,
      packageId,
      addOnIds,
      convocationEventId,
    );
    return {
      success: `Booking Request recorded for ${studentId} (${booking.id.slice(0, 8)}).`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    revalidateBookingViews();
  }
}

export async function bookingLifecycleAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const intent = String(formData.get("intent") ?? "");

  if (!bookingId || !isLifecycleIntent(intent)) {
    return { error: "Unrecognised Booking action." };
  }

  const bookings = getServices().bookings;
  const shortId = bookingId.slice(0, 8);

  try {
    switch (intent) {
      case "accept":
        bookings.acceptBookingRequest(bookingId);
        return { success: `Booking ${shortId} accepted.` };
      case "reject":
        bookings.rejectBookingRequest(bookingId);
        return { success: `Booking ${shortId} rejected; the time slot is open again.` };
      case "pay-commitment":
        bookings.payCommitmentPayment(bookingId);
        return { success: `Commitment Payment recorded for Booking ${shortId}.` };
      case "cancel-student":
        bookings.cancelByStudent(bookingId);
        return { success: `Booking ${shortId} cancelled by the Student; no refund.` };
      case "cancel-photographer":
        bookings.cancelByPhotographer(bookingId);
        return { success: `Booking ${shortId} cancelled by the Photographer; refunded.` };
      case "mark-photos-ready": {
        const deliveryLink = String(formData.get("deliveryLink") ?? "").trim();
        if (!deliveryLink) {
          return { error: "A Delivery link is required to mark photos ready." };
        }
        bookings.markPhotosReady(bookingId, deliveryLink);
        return { success: `Booking ${shortId} is awaiting Final Payment.` };
      }
      case "pay-final":
        bookings.payFinalPayment(bookingId);
        return { success: `Final Payment recorded; Booking ${shortId} is delivered.` };
    }
  } catch (error) {
    // Surface the domain layer's own wording — it names the actual status
    // conflict, which is what the operator needs to decide what to do next.
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    revalidateBookingViews();
  }
}
