import type { ActionState } from "./actions";
import styles from "./detail.module.css";

/**
 * Every form on this screen stays mounted across its own submission — unlike
 * the Photographers table, where approving a row destroys the row that
 * dispatched the action. That means each form can own its action state and
 * report next to itself, so feedback appears where the operator is looking
 * rather than in one banner at the top of a long screen.
 */
export function InlineFeedback({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className={`${styles.banner} ${styles.bannerError}`}>
        <span className={styles.srOnly}>Error: </span>
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className={`${styles.banner} ${styles.bannerSuccess}`}>
        {state.success}
      </p>
    );
  }
  return null;
}
