import Link from "next/link";
import { getServices } from "../lib/services";
import type { Photographer } from "../../src/photographer-registry";
import { FeedbackProvider } from "./feedback";
import { RegisterForm } from "./register-form";
import { RowActions } from "./row-actions";
import { StatusBadge } from "./status-badge";
import styles from "./photographers.module.css";

// Read SQLite on every request. Without this Next.js prerenders the table at
// build time and serves a stale roster until the next mutation revalidates it.
export const dynamic = "force-dynamic";

// Pending first: clearing the vetting queue is the only recurring job on this
// screen, and a Photographer cannot opt into a Convocation Event until Approved.
const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 } as const;

function sortForReview(photographers: Photographer[]): Photographer[] {
  return [...photographers].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.name.localeCompare(b.name),
  );
}

export default function PhotographersPage() {
  const photographers = sortForReview(
    getServices().photographers.listAllPhotographers(),
  );
  const pendingCount = photographers.filter((p) => p.status === "pending").length;

  return (
    <FeedbackProvider>
      <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Photographers</h1>
          <p className={styles.subtitle}>
            {photographers.length} total
            {pendingCount > 0 ? ` · ${pendingCount} awaiting review` : ""}
          </p>
        </div>
        <RegisterForm />
      </header>

      {photographers.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No Photographers yet</p>
          <p className={styles.emptyBody}>
            Register your first Photographer to start building the roster.
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            All Photographers and their vetting status
          </caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">ID</th>
              <th scope="col" className={styles.actionsHeader}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {photographers.map((photographer) => (
              <tr key={photographer.id}>
                <td className={styles.nameCell}>
                  <Link
                    href={`/photographers/${photographer.id}`}
                    className={styles.nameLink}
                  >
                    {photographer.name}
                  </Link>
                </td>
                <td>
                  <StatusBadge status={photographer.status} />
                </td>
                <td className={styles.idCell} title={photographer.id}>
                  {photographer.id.slice(0, 8)}
                </td>
                <td className={styles.actionsCell}>
                  {photographer.status === "pending" ? (
                    <RowActions
                      photographerId={photographer.id}
                      name={photographer.name}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </FeedbackProvider>
  );
}
