"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addAddOnAction,
  createPackageAction,
  type ActionState,
} from "./actions";
import { InlineFeedback } from "./inline-feedback";
import styles from "./detail.module.css";

const EMPTY: ActionState = {};

export function CreatePackageForm({
  photographerId,
  disabledReason,
}: {
  photographerId: string;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(createPackageAction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state.success]);

  // Only an Approved Photographer may hold Packages — the domain layer throws
  // otherwise. Say so up front instead of letting the operator fill in a form
  // that cannot succeed.
  if (disabledReason) {
    return <p className={styles.hint}>{disabledReason}</p>;
  }

  return (
    <div className={styles.formBlock}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="create-package-form"
        className={`${styles.button} ${styles.primaryButton}`}
      >
        {open ? "Cancel" : "Add Package"}
      </button>

      <InlineFeedback state={state} />

      {open ? (
        <form
          id="create-package-form"
          ref={formRef}
          action={submit}
          className={styles.form}
        >
          <input type="hidden" name="photographerId" value={photographerId} />
          <div className={styles.field}>
            <label htmlFor="package-name" className={styles.label}>
              Package name
            </label>
            <input
              id="package-name"
              ref={nameRef}
              name="name"
              type="text"
              required
              autoFocus
              autoComplete="off"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="package-price" className={styles.label}>
              Price (RM)
            </label>
            <input
              id="package-price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="package-description" className={styles.label}>
              Description
            </label>
            <textarea
              id="package-description"
              name="description"
              required
              rows={3}
              aria-describedby="package-description-hint"
              className={styles.textarea}
            />
            <p id="package-description-hint" className={styles.hint}>
              What the Student gets, e.g. &ldquo;2hrs, 30 edited photos&rdquo;.
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {pending ? "Creating…" : "Create Package"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function AddAddOnForm({
  photographerId,
  packageId,
  packageName,
}: {
  photographerId: string;
  packageId: string;
  packageName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(addAddOnAction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state.success]);

  const formId = `add-on-form-${packageId}`;

  return (
    <div className={styles.formBlock}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={formId}
        className={styles.button}
      >
        {open ? "Cancel" : "Add Add-on"}
        <span className={styles.srOnly}> to {packageName}</span>
      </button>

      <InlineFeedback state={state} />

      {open ? (
        <form id={formId} ref={formRef} action={submit} className={styles.formRow}>
          <input type="hidden" name="photographerId" value={photographerId} />
          <input type="hidden" name="packageId" value={packageId} />
          <div className={styles.field}>
            <label htmlFor={`${formId}-name`} className={styles.label}>
              Add-on name
            </label>
            <input
              id={`${formId}-name`}
              ref={nameRef}
              name="name"
              type="text"
              required
              autoFocus
              autoComplete="off"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-price`} className={styles.label}>
              Price (RM)
            </label>
            <input
              id={`${formId}-price`}
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
