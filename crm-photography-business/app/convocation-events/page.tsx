import { getServices } from "../lib/services";
import type { ConvocationEvent } from "../../src/convocation-event-registry";
import { CreateEventForm } from "./create-form";
import styles from "./convocation-events.module.css";

// Read SQLite on every request. Without this Next.js prerenders the table at
// build time and serves a stale schedule until the next mutation revalidates it.
export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * An event happening later today is still upcoming, so "upcoming" is measured
 * from local start-of-today rather than from the current instant — otherwise a
 * ceremony the operator just created for today would vanish from the list.
 */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function soonestFirst(events: ConvocationEvent[]): ConvocationEvent[] {
  return [...events].sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      a.university.localeCompare(b.university) ||
      a.faculty.localeCompare(b.faculty),
  );
}

export default function ConvocationEventsPage() {
  const events = soonestFirst(
    getServices().convocationEvents.listUpcomingConvocationEvents(startOfToday()),
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Convocation Events</h1>
          <p className={styles.subtitle}>
            {events.length} upcoming{events.length === 1 ? " event" : " events"}
          </p>
        </div>
        <CreateEventForm />
      </header>

      {events.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No upcoming Convocation Events</p>
          <p className={styles.emptyBody}>
            Create one so Photographers can open time slots against it.
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            Upcoming Convocation Events, soonest first
          </caption>
          <thead>
            <tr>
              <th scope="col">University</th>
              <th scope="col">Faculty</th>
              <th scope="col">Date</th>
              <th scope="col">Venue</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className={styles.nameCell}>{event.university}</td>
                <td data-label="Faculty">{event.faculty}</td>
                <td data-label="Date">
                  <time dateTime={event.date.toISOString()}>
                    {DATE_FORMAT.format(event.date)}
                  </time>
                </td>
                <td data-label="Venue">{event.venue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
