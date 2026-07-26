"use client";

import { useActionState } from "react";
import { dismissLeadAction, type ActionState } from "./actions";
import styles from "./convocation-leads.module.css";

const EMPTY: ActionState = {};

export function DismissButton({ leadId }: { leadId: string }) {
  const [state, submit, pending] = useActionState(dismissLeadAction, EMPTY);

  return (
    <form action={submit} className={styles.dismissForm}>
      <input type="hidden" name="leadId" value={leadId} />
      <button type="submit" disabled={pending} className={styles.button}>
        {pending ? "Dismissing…" : "Dismiss"}
      </button>
      {state.error ? (
        <p role="alert" className={`${styles.banner} ${styles.bannerError}`}>
          <span className={styles.srOnly}>Error: </span>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
