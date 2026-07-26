"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createConvocationEventAction, type ActionState } from "./actions";
import styles from "./convocation-events.module.css";

const EMPTY: ActionState = {};

const TEXT_FIELDS = [
  {
    name: "university",
    label: "University",
    hint: "The awarding institution, e.g. Universiti Malaya.",
  },
  {
    name: "faculty",
    label: "Faculty",
    hint: "Convocations run per faculty — each gets its own event.",
  },
  { name: "venue", label: "Venue", hint: "Where the ceremony is held." },
] as const;

/**
 * Owns its own action state and never unmounts, so the feedback banner it
 * renders always survives the re-render its own submission triggers.
 */
export function CreateEventForm() {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(
    createConvocationEventAction,
    EMPTY,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Clear the fields after a successful create so the operator can enter the
  // next faculty's ceremony without reaching for the mouse.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      firstFieldRef.current?.focus();
    }
  }, [state.success]);

  return (
    <section className={styles.createPanel}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="create-convocation-event-form"
        className={`${styles.button} ${styles.primaryButton}`}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d={open ? "M4 8h8" : "M8 4v8M4 8h8"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
        {open ? "Cancel" : "New Convocation Event"}
      </button>

      {state.error ? (
        <p role="alert" className={`${styles.banner} ${styles.bannerError}`}>
          <span className={styles.srOnly}>Error: </span>
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className={`${styles.banner} ${styles.bannerSuccess}`}>
          {state.success}
        </p>
      ) : null}

      {open ? (
        <form
          id="create-convocation-event-form"
          ref={formRef}
          action={submit}
          className={styles.createForm}
        >
          {TEXT_FIELDS.map((field, index) => (
            <div key={field.name} className={styles.field}>
              <label htmlFor={`event-${field.name}`} className={styles.label}>
                {field.label}
              </label>
              <input
                id={`event-${field.name}`}
                ref={index === 0 ? firstFieldRef : undefined}
                name={field.name}
                type="text"
                required
                autoFocus={index === 0}
                autoComplete="off"
                aria-describedby={`event-${field.name}-hint`}
                className={styles.input}
              />
              <p id={`event-${field.name}-hint`} className={styles.hint}>
                {field.hint}
              </p>
            </div>
          ))}

          <div className={styles.field}>
            <label htmlFor="event-date" className={styles.label}>
              Date
            </label>
            <input
              id="event-date"
              name="date"
              type="date"
              required
              aria-describedby="event-date-hint"
              className={styles.input}
            />
            <p id="event-date-hint" className={styles.hint}>
              Photographers open their time slots against this date.
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {pending ? "Creating…" : "Create Event"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
