"use client";

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { reviewPhotographerAction, type ActionState } from "./actions";
import styles from "./photographers.module.css";

/**
 * Approve/reject state is owned HERE, above the table — not inside a row.
 *
 * An approve or reject re-renders the page and usually removes the row it was
 * dispatched from (the Photographer stops being Pending, so its action buttons
 * disappear). React applies the action result and that re-render in the same
 * commit, so a `useActionState` living inside the row is torn down before its
 * error can ever be read or reported — the operator clicks and sees nothing
 * happen, which Ticket 08 explicitly forbids. This component never unmounts,
 * so the message always survives.
 *
 * This is why approve and reject share one action: one owner, one state.
 */
interface ReviewContextValue {
  dispatch: (formData: FormData) => void;
  pending: boolean;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);
const AnnounceContext = createContext<((state: ActionState) => void) | null>(null);

const EMPTY: ActionState = {};

export function useReviewAction(): ReviewContextValue {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReviewAction must be used within a FeedbackProvider");
  }
  return context;
}

/**
 * Lets a component that owns its own action state (the register form, which
 * never unmounts) publish into the same banner.
 */
export function useAnnounce(state: ActionState) {
  const announce = useContext(AnnounceContext);
  useEffect(() => {
    if (announce && (state.error || state.success)) {
      announce(state);
    }
  }, [state, announce]);
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [reviewState, dispatch, pending] = useActionState(
    reviewPhotographerAction,
    EMPTY,
  );
  const [message, setMessage] = useState<ActionState>(EMPTY);

  const announce = useCallback((next: ActionState) => setMessage(next), []);

  // Mirror review results into the shared banner; whichever source reported
  // most recently is what the operator sees.
  useEffect(() => {
    if (reviewState.error || reviewState.success) {
      setMessage(reviewState);
    }
  }, [reviewState]);

  return (
    <ReviewContext.Provider value={{ dispatch, pending }}>
      <AnnounceContext.Provider value={announce}>
        {message.error ? (
          <p role="alert" className={`${styles.banner} ${styles.bannerError}`}>
            <span className={styles.srOnly}>Error: </span>
            {message.error}
          </p>
        ) : null}
        {message.success ? (
          <p role="status" className={`${styles.banner} ${styles.bannerSuccess}`}>
            {message.success}
          </p>
        ) : null}
        {children}
      </AnnounceContext.Provider>
    </ReviewContext.Provider>
  );
}
