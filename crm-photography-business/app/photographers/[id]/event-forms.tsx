"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  defineTimeSlotAction,
  optInAction,
  type ActionState,
} from "./actions";
import { InlineFeedback } from "./inline-feedback";
import styles from "./detail.module.css";

const EMPTY: ActionState = {};

export interface EventOption {
  id: string;
  label: string;
}

export function OptInForm({
  photographerId,
  options,
  disabledReason,
}: {
  photographerId: string;
  options: EventOption[];
  disabledReason?: string;
}) {
  const [state, submit, pending] = useActionState(optInAction, EMPTY);

  // Only an Approved Photographer may opt in — the domain layer throws
  // otherwise. Don't offer a control that cannot succeed.
  if (disabledReason) {
    return <p className={styles.hint}>{disabledReason}</p>;
  }

  // The banner is rendered ABOVE the branch below, not inside the form. Opting
  // into the last remaining event empties `options`, so a banner living in the
  // form branch would be unmounted by the very action that wrote it — the
  // operator would click "Opt in" and see no confirmation at all.
  return (
    <div className={styles.formBlock}>
      <InlineFeedback state={state} />

      {options.length === 0 ? (
        <p className={styles.hint}>
          No further upcoming Convocation Events to opt into.
        </p>
      ) : (
        <form action={submit} className={styles.formRow}>
          <input type="hidden" name="photographerId" value={photographerId} />
          <div className={styles.field}>
            <label htmlFor="opt-in-event" className={styles.label}>
              Convocation Event
            </label>
            {/* Uncontrolled with no blank option: the browser preselects the
                first entry, so the operator can opt in with a single click when
                there is only one event to choose. */}
            <select
              id="opt-in-event"
              name="convocationEventId"
              required
              className={styles.input}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {pending ? "Opting in…" : "Opt in"}
          </button>
        </form>
      )}
    </div>
  );
}

export function DefineTimeSlotForm({
  photographerId,
  convocationEventId,
  eventLabel,
}: {
  photographerId: string;
  convocationEventId: string;
  eventLabel: string;
}) {
  const [state, submit, pending] = useActionState(defineTimeSlotAction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const startRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      startRef.current?.focus();
    }
  }, [state.success]);

  const formId = `time-slot-form-${convocationEventId}`;

  return (
    <div className={styles.formBlock}>
      <InlineFeedback state={state} />
      <form id={formId} ref={formRef} action={submit} className={styles.formRow}>
        <input type="hidden" name="photographerId" value={photographerId} />
        <input
          type="hidden"
          name="convocationEventId"
          value={convocationEventId}
        />
        <div className={styles.field}>
          <label htmlFor={`${formId}-start`} className={styles.label}>
            Start
          </label>
          <input
            id={`${formId}-start`}
            ref={startRef}
            name="start"
            type="datetime-local"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${formId}-end`} className={styles.label}>
            End
          </label>
          <input
            id={`${formId}-end`}
            name="end"
            type="datetime-local"
            required
            className={styles.input}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          {pending ? "Adding…" : "Add Time Slot"}
          <span className={styles.srOnly}> for {eventLabel}</span>
        </button>
      </form>
    </div>
  );
}
