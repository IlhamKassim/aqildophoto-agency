import Link from "next/link";
import { getServices } from "../lib/services";
import { TaskRunner } from "./task-runner";
import styles from "./scheduled-tasks.module.css";

// Read SQLite on every request: the counts below are the operator's cue that a
// sweep is worth running, so they must not be a build-time snapshot.
export const dynamic = "force-dynamic";

export default function ScheduledTasksPage() {
  const bookings = getServices().bookings.listAllBookings();
  const requestedCount = bookings.filter((b) => b.status === "requested").length;
  const awaitingPayoutCount = bookings.filter(
    (b) => b.status === "committed" && !b.payoutReleasedAt,
  ).length;

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Scheduled Tasks</h1>
        <p className={styles.subtitle}>
          Time-driven sweeps, run by hand until a scheduler runs them. Each one
          reports what its last run changed.
        </p>
      </header>

      <div className={styles.grid}>
        <TaskRunner
          intent="expire-stale-requests"
          title="Expire stale Booking Requests"
          description={`Marks every Requested Booking past its response deadline as Expired and reopens its time slot. ${requestedCount} Booking(s) currently Requested.`}
          runLabel="Expire stale requests"
          emptyResult="no Booking Request had passed its deadline"
          affectedNoun="Booking expired"
        />

        <TaskRunner
          intent="release-payouts"
          title="Release eligible payouts"
          description={`Releases the Photographer's payout for every Committed Booking whose Convocation Event has taken place. ${awaitingPayoutCount} Committed Booking(s) awaiting release.`}
          runLabel="Release payouts"
          emptyResult="no payout was eligible for release"
          affectedNoun="payout released"
        />
      </div>

      <p className={styles.hint}>
        Both sweeps change Booking state — review the results on the{" "}
        <Link href="/bookings" className={styles.inlineLink}>
          Bookings
        </Link>{" "}
        screen.
      </p>
    </div>
  );
}
