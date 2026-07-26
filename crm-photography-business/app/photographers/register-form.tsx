"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registerPhotographerAction, type ActionState } from "./actions";
import { useAnnounce } from "./feedback";
import styles from "./photographers.module.css";

const EMPTY: ActionState = {};

export function RegisterForm() {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(registerPhotographerAction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useAnnounce(state);

  // Clear the field after a successful registration so the operator can enter
  // the next Photographer without reaching for the mouse.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state.success]);

  return (
    <section className={styles.registerPanel}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="register-photographer-form"
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
        {open ? "Cancel" : "Register Photographer"}
      </button>

      {open ? (
        <form
          id="register-photographer-form"
          ref={formRef}
          action={submit}
          className={styles.registerForm}
        >
          <div className={styles.field}>
            <label htmlFor="photographer-name" className={styles.label}>
              Name
            </label>
            <input
              id="photographer-name"
              ref={nameRef}
              name="name"
              type="text"
              required
              autoFocus
              autoComplete="off"
              aria-describedby="photographer-name-hint"
              className={styles.input}
            />
            <p id="photographer-name-hint" className={styles.hint}>
              New Photographers start as Pending and must be approved before they
              can opt into a Convocation Event.
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {pending ? "Registering…" : "Register"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
