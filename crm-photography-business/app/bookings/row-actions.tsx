"use client";

import { useState } from "react";
import type { BookingStatus } from "../../src/booking-board";
import type { LifecycleIntent } from "./actions";
import { useLifecycleAction } from "./feedback";
import styles from "./bookings.module.css";

/**
 * Which moves each status allows. A status absent from this map (rejected,
 * expired, cancelled, delivered) is terminal on this screen and shows no
 * actions at all — Ticket 11 requires invalid actions not be exposed.
 *
 * The domain layer enforces the same rule; this map exists so the operator is
 * never offered a button that can only fail.
 */
const INTENTS_BY_STATUS: Partial<Record<BookingStatus, LifecycleIntent[]>> = {
  requested: ["accept", "reject"],
  accepted: ["pay-commitment"],
  committed: ["cancel-student", "cancel-photographer"],
  awaiting_final_payment: ["pay-final"],
};

const LABELS: Record<LifecycleIntent, string> = {
  accept: "Accept",
  reject: "Reject",
  "pay-commitment": "Record Commitment Payment",
  "cancel-student": "Cancel (Student)",
  "cancel-photographer": "Cancel (Photographer)",
  "mark-photos-ready": "Mark photos ready",
  "pay-final": "Record Final Payment",
};

// Destructive-looking moves get the outlined red treatment so an accidental
// click is less likely; the rest stay neutral.
const DESTRUCTIVE: ReadonlySet<LifecycleIntent> = new Set([
  "reject",
  "cancel-student",
  "cancel-photographer",
]);

export function RowActions({
  bookingId,
  status,
  studentId,
}: {
  bookingId: string;
  status: BookingStatus;
  studentId: string;
}) {
  const { dispatch, pending } = useLifecycleAction();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const intents = INTENTS_BY_STATUS[status] ?? [];

  if (intents.length === 0) {
    return null;
  }

  return (
    <div className={styles.actionStack}>
      {intents.map((intent) => (
        <form key={intent} action={dispatch}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="intent" value={intent} />
          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${
              intent === "accept" ? styles.approveButton : ""
            } ${DESTRUCTIVE.has(intent) ? styles.rejectButton : ""}`}
          >
            {LABELS[intent]}
            <span className={styles.srOnly}> booking for {studentId}</span>
          </button>
        </form>
      ))}

      {/* Marking photos ready needs a Delivery link, so it is a disclosure
          rather than a bare button — the input has to exist before submit. */}
      {status === "committed" ? (
        <>
          <button
            type="button"
            onClick={() => setDeliveryOpen((open) => !open)}
            aria-expanded={deliveryOpen}
            aria-controls={`delivery-${bookingId}`}
            className={styles.button}
          >
            {deliveryOpen ? "Cancel" : LABELS["mark-photos-ready"]}
            <span className={styles.srOnly}> for {studentId}</span>
          </button>

          {deliveryOpen ? (
            <form
              id={`delivery-${bookingId}`}
              action={dispatch}
              className={styles.deliveryForm}
            >
              <input type="hidden" name="bookingId" value={bookingId} />
              <input type="hidden" name="intent" value="mark-photos-ready" />
              <div className={styles.field}>
                <label
                  htmlFor={`delivery-link-${bookingId}`}
                  className={styles.label}
                >
                  Delivery link
                </label>
                <input
                  id={`delivery-link-${bookingId}`}
                  name="deliveryLink"
                  type="url"
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="https://…"
                  className={styles.input}
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className={`${styles.button} ${styles.primaryButton}`}
              >
                {pending ? "Saving…" : "Mark ready"}
              </button>
            </form>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
