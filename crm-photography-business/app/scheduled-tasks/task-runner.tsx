"use client";

import { useActionState } from "react";
import {
  runScheduledTaskAction,
  type TaskIntent,
  type TaskRunState,
} from "./actions";
import styles from "./scheduled-tasks.module.css";

const EMPTY: TaskRunState = {};

const RAN_AT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * One card per task, each owning its own action state — that is how "the last
 * run of each" stays on screen: running one sweep must not wipe the report of
 * the other. Neither card unmounts, so its result survives the re-render its
 * own run triggers.
 */
export function TaskRunner({
  intent,
  title,
  description,
  runLabel,
  emptyResult,
  affectedNoun,
}: {
  intent: TaskIntent;
  title: string;
  description: string;
  runLabel: string;
  emptyResult: string;
  affectedNoun: string;
}) {
  const [state, submit, pending] = useActionState(runScheduledTaskAction, EMPTY);
  const affected = state.affected ?? [];

  return (
    <section className={styles.card} aria-labelledby={`task-${intent}`}>
      <div>
        <h2 id={`task-${intent}`} className={styles.cardTitle}>
          {title}
        </h2>
        <p className={styles.hint}>{description}</p>
      </div>

      <form action={submit}>
        <input type="hidden" name="intent" value={intent} />
        <button
          type="submit"
          disabled={pending}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          {pending ? "Running…" : runLabel}
        </button>
      </form>

      {state.error ? (
        <p role="alert" className={`${styles.banner} ${styles.bannerError}`}>
          <span className={styles.srOnly}>Error: </span>
          {state.error}
        </p>
      ) : null}

      {/* `ranAt` — not the affected list — is what marks a run as having
          happened, so a sweep that touched nothing still reports back. */}
      {state.ranAt ? (
        <div role="status" className={styles.result}>
          <p className={styles.resultHeading}>
            Last run{" "}
            <time dateTime={state.ranAt}>
              {RAN_AT.format(new Date(state.ranAt))}
            </time>
            {" — "}
            {affected.length === 0
              ? emptyResult
              : `${affected.length} ${affectedNoun}${affected.length === 1 ? "" : "s"}`}
          </p>

          {affected.length > 0 ? (
            <ul className={styles.resultList}>
              {affected.map((booking) => (
                <li key={booking.id} className={styles.resultItem}>
                  <span className={styles.resultStudent}>
                    {booking.studentId}
                  </span>
                  <span className={styles.resultId} title={booking.id}>
                    {booking.id.slice(0, 8)}
                  </span>
                  <span className={styles.resultDetail}>{booking.detail}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
