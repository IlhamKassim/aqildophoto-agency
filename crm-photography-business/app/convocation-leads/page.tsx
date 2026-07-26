import { getServices } from "../lib/services";
import { DismissButton } from "./dismiss-button";
import styles from "./convocation-leads.module.css";

// Read SQLite on every request: dismissals and new scrape results must show
// up immediately, not a build-time snapshot.
export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const RAN_AT_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ConvocationLeadsPage() {
  const services = getServices();
  const leads = services.convocationLeads.listUpcomingLeads();
  const sourceRunStatuses = services.scraperRunner.getSourceRunStatuses();
  const subtitle =
    `${leads.length} upcoming ${leads.length === 1 ? "lead" : "leads"} in the ` +
    "next 6 months — scraped from each university's own site, not yet " +
    "onboarded as a Convocation Event.";

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Convocation Leads</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {leads.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No upcoming Convocation Leads</p>
          <p className={styles.emptyBody}>
            Either nothing is scheduled in the next 6 months, or every Lead in
            that window has already been dismissed.
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            Upcoming Convocation Leads, soonest first
          </caption>
          <thead>
            <tr>
              <th scope="col">University</th>
              <th scope="col">Date</th>
              <th scope="col">Venue</th>
              <th scope="col">
                <span className={styles.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className={styles.nameCell}>{lead.university}</td>
                <td data-label="Date">
                  <time dateTime={lead.date.toISOString()}>
                    {DATE_FORMAT.format(lead.date)}
                  </time>
                </td>
                <td data-label="Venue">{lead.venue ?? "—"}</td>
                <td data-label="Actions">
                  <DismissButton leadId={lead.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <section aria-labelledby="source-status-heading">
        <h2 id="source-status-heading" className={styles.sectionTitle}>
          Scraper sources
        </h2>
        {sourceRunStatuses.length === 0 ? (
          <p className={styles.hint}>No source has run yet.</p>
        ) : (
          <ul className={styles.sourceList}>
            {sourceRunStatuses.map((status) => (
              <li key={status.sourceId} className={styles.sourceItem}>
                <span
                  className={`${styles.badge} ${
                    status.status === "ok" ? styles.approved : styles.rejected
                  }`}
                >
                  {status.status === "ok" ? "OK" : "Failed"}
                </span>
                <span className={styles.sourceName}>{status.sourceName}</span>
                <time dateTime={status.ranAt.toISOString()} className={styles.hint}>
                  {RAN_AT_FORMAT.format(status.ranAt)}
                </time>
                {status.reason ? (
                  <span className={styles.hint}>— {status.reason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
