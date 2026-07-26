import type { PhotographerStatus } from "../../src/photographer-registry";
import styles from "./photographers.module.css";

/**
 * Status is conveyed by icon + text + colour together. Colour alone would fail
 * for operators who cannot distinguish the amber/green/red hues.
 */
const ICONS: Record<PhotographerStatus, React.ReactNode> = {
  pending: (
    <path
      d="M8 4.5V8l2.5 1.5M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  approved: (
    <path
      d="m4 8.5 2.5 2.5L12 5.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  rejected: (
    <path
      d="m5 5 6 6M11 5l-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const LABELS: Record<PhotographerStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: PhotographerStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        {ICONS[status]}
      </svg>
      {LABELS[status]}
    </span>
  );
}
