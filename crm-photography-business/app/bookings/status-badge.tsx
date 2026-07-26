import type { BookingStatus } from "../../src/booking-board";
import styles from "./bookings.module.css";

/**
 * Status is conveyed by text + colour together, and the eight Booking statuses
 * share three tones: in-flight (amber), settled (green), and closed-without-
 * delivery (red). Colour alone never carries the meaning — the label is always
 * rendered — so statuses collapsing onto one tone stays readable.
 */
const TONES: Record<BookingStatus, "pending" | "approved" | "rejected"> = {
  requested: "pending",
  accepted: "pending",
  committed: "pending",
  awaiting_final_payment: "pending",
  delivered: "approved",
  rejected: "rejected",
  expired: "rejected",
  cancelled: "rejected",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  committed: "Committed",
  cancelled: "Cancelled",
  awaiting_final_payment: "Awaiting Final Payment",
  delivered: "Delivered",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`${styles.badge} ${styles[TONES[status]]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
