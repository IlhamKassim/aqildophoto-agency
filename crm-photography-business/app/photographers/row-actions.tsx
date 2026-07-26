"use client";

import { useReviewAction } from "./feedback";
import styles from "./photographers.module.css";

/**
 * Stateless by design — the approve/reject action state lives in
 * FeedbackProvider, because this component unmounts as a result of its own
 * action. See the note in `feedback.tsx`.
 */
export function RowActions({
  photographerId,
  name,
}: {
  photographerId: string;
  name: string;
}) {
  const { dispatch, pending } = useReviewAction();

  return (
    <div className={styles.buttonPair}>
      {(["approve", "reject"] as const).map((intent) => (
        <form key={intent} action={dispatch}>
          <input type="hidden" name="photographerId" value={photographerId} />
          <input type="hidden" name="intent" value={intent} />
          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${
              intent === "approve" ? styles.approveButton : styles.rejectButton
            }`}
          >
            {intent === "approve" ? "Approve" : "Reject"}
            <span className={styles.srOnly}> {name}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
