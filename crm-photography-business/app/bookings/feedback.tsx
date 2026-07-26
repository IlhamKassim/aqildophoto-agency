"use client";

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { bookingLifecycleAction, type ActionState } from "./actions";
import styles from "./bookings.module.css";

/**
 * Lifecycle action state is owned HERE, above the table — not inside a row.
 *
 * Every lifecycle move changes the Booking's status, and the row re-renders
 * with a different set of action buttons in the same commit that applies the
 * action result. A `useActionState` living in the row is torn down before its
 * error can be read, so the operator would click and see nothing happen —
 * which Ticket 11 explicitly forbids. This provider never unmounts.
 *
 * One owner, one state: that is why all seven intents share a single action.
 */
interface LifecycleContextValue {
  dispatch: (formData: FormData) => void;
  pending: boolean;
}

const LifecycleContext = createContext<LifecycleContextValue | null>(null);
const AnnounceContext = createContext<((state: ActionState) => void) | null>(null);

const EMPTY: ActionState = {};

export function useLifecycleAction(): LifecycleContextValue {
  const context = useContext(LifecycleContext);
  if (!context) {
    throw new Error("useLifecycleAction must be used within a FeedbackProvider");
  }
  return context;
}

/**
 * Lets a component that owns its own action state (the request form, which
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
  const [lifecycleState, dispatch, pending] = useActionState(
    bookingLifecycleAction,
    EMPTY,
  );
  const [message, setMessage] = useState<ActionState>(EMPTY);

  const announce = useCallback((next: ActionState) => setMessage(next), []);

  // Mirror lifecycle results into the shared banner; whichever source reported
  // most recently is what the operator sees.
  useEffect(() => {
    if (lifecycleState.error || lifecycleState.success) {
      setMessage(lifecycleState);
    }
  }, [lifecycleState]);

  return (
    <LifecycleContext.Provider value={{ dispatch, pending }}>
      <AnnounceContext.Provider value={announce}>
        {message.error || message.success ? (
          <div className={styles.bannerSlot}>
            {message.error ? (
              <p role="alert" className={`${styles.banner} ${styles.bannerError}`}>
                <span className={styles.srOnly}>Error: </span>
                {message.error}
              </p>
            ) : null}
            {message.success ? (
              <p
                role="status"
                className={`${styles.banner} ${styles.bannerSuccess}`}
              >
                {message.success}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </AnnounceContext.Provider>
    </LifecycleContext.Provider>
  );
}
