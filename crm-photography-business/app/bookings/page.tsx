import { getServices } from "../lib/services";
import type { Booking, CommissionSplit } from "../../src/booking-board";
import type { PackageWithAddOns } from "../../src/package-catalog";
import { FeedbackProvider } from "./feedback";
import { RequestBookingForm, type EventOption } from "./request-form";
import { RowActions } from "./row-actions";
import { StatusBadge } from "./status-badge";
import styles from "./bookings.module.css";

// Read SQLite on every request. Without this Next.js prerenders the table at
// build time and serves stale lifecycle state until the next mutation.
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** An event happening later today is still bookable. See the Events screen. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function slotLabel(start: Date, end: Date): string {
  return `${DATE_TIME.format(start)} – ${DATE_TIME.format(end)}`;
}

function splitSummary(split: CommissionSplit): string {
  return `${MONEY.format(split.amount)} · agency ${MONEY.format(
    split.agencyShare,
  )} / photographer ${MONEY.format(split.photographerShare)}`;
}

export default function BookingsPage() {
  const services = getServices();

  const photographerNames = new Map(
    services.photographers
      .listAllPhotographers()
      .map((photographer) => [photographer.id, photographer.name]),
  );

  // A Booking stores a Package id, not a name. The catalog is queried per
  // Photographer, so flatten every Photographer's Packages once and index
  // them — one pass serves both the table and the request form.
  const packagesByPhotographer = new Map<string, PackageWithAddOns[]>();
  const packagesById = new Map<string, PackageWithAddOns>();
  const addOnNames = new Map<string, string>();
  for (const photographerId of photographerNames.keys()) {
    const packages = services.packages.listPackagesWithAddOns(photographerId);
    packagesByPhotographer.set(photographerId, packages);
    for (const pkg of packages) {
      packagesById.set(pkg.id, pkg);
      for (const addOn of pkg.addOns) {
        addOnNames.set(addOn.id, addOn.name);
      }
    }
  }

  const events: EventOption[] = services.convocationEvents
    .listUpcomingConvocationEvents(startOfToday())
    .map((event) => ({
      id: event.id,
      label: `${event.university} — ${event.faculty} · ${DATE.format(event.date)}`,
      photographers: services.timeSlots
        .listOptedInPhotographerIds(event.id)
        // An opted-in Photographer can be rejected afterwards; the domain layer
        // would still let the slot be booked, but the agency should not offer it.
        .filter((id) => services.photographers.isApproved(id))
        .map((photographerId) => ({
          id: photographerId,
          name: photographerNames.get(photographerId) ?? photographerId,
          slots: services.timeSlots
            .listOpenTimeSlots(event.id, photographerId)
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map((slot) => ({ id: slot.id, label: slotLabel(slot.start, slot.end) })),
          packages: (packagesByPhotographer.get(photographerId) ?? []).map((pkg) => ({
            id: pkg.id,
            name: `${pkg.name} · ${MONEY.format(pkg.price)}`,
            price: pkg.price,
            addOns: pkg.addOns.map((addOn) => ({
              id: addOn.id,
              name: `${addOn.name} · ${MONEY.format(addOn.price)}`,
              price: addOn.price,
            })),
          })),
        })),
    }));

  // Newest request first: the top of the table is where the work is.
  const bookings: Booking[] = [...services.bookings.listAllBookings()].sort(
    (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime(),
  );

  const openCount = bookings.filter((booking) =>
    ["requested", "accepted", "committed", "awaiting_final_payment"].includes(
      booking.status,
    ),
  ).length;

  return (
    <FeedbackProvider>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Bookings</h1>
            <p className={styles.subtitle}>
              {bookings.length} total
              {openCount > 0 ? ` · ${openCount} still in flight` : ""}
            </p>
          </div>
          <RequestBookingForm events={events} />
        </header>

        {bookings.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No Bookings yet</p>
            <p className={styles.emptyBody}>
              Record a Booking Request against an open time slot to start the
              lifecycle.
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              All Bookings and their lifecycle status, newest request first
            </caption>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Package</th>
                <th scope="col">Status</th>
                <th scope="col">Payments</th>
                <th scope="col" className={styles.actionsHeader}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const pkg = packagesById.get(booking.packageId);
                const photographerName = pkg
                  ? photographerNames.get(pkg.photographerId)
                  : undefined;
                const addOns = booking.addOnIds.map(
                  (id) => addOnNames.get(id) ?? id,
                );
                // Only a delivered Booking exposes its link — the domain layer
                // throws for any earlier status, which is the rule we want.
                const deliveryLink =
                  booking.status === "delivered"
                    ? services.bookings.getDeliveryLink(booking.id)
                    : undefined;

                return (
                  <tr key={booking.id}>
                    <td className={styles.nameCell}>
                      {booking.studentId}
                      <span className={styles.rowMeta}>
                        requested {DATE.format(booking.requestedAt)}
                      </span>
                    </td>
                    <td data-label="Package">
                      {pkg?.name ?? booking.packageId}
                      {photographerName ? (
                        <span className={styles.rowMeta}>
                          with {photographerName}
                        </span>
                      ) : null}
                      {addOns.length > 0 ? (
                        <span className={styles.rowMeta}>
                          add-ons: {addOns.join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={booking.status} />
                      {booking.cancelledBy ? (
                        <span className={styles.rowMeta}>
                          by {booking.cancelledBy}
                          {booking.refunded ? ", refunded" : ", no refund"}
                        </span>
                      ) : null}
                      {booking.payoutReleasedAt ? (
                        <span className={styles.rowMeta}>payout released</span>
                      ) : null}
                    </td>
                    <td data-label="Payments" className={styles.paymentsCell}>
                      {booking.commitmentPayment ? (
                        <span className={styles.rowMeta}>
                          Commitment: {splitSummary(booking.commitmentPayment)}
                        </span>
                      ) : null}
                      {booking.finalPayment ? (
                        <span className={styles.rowMeta}>
                          Final: {splitSummary(booking.finalPayment)}
                        </span>
                      ) : null}
                      {deliveryLink ? (
                        <a
                          href={deliveryLink}
                          className={styles.deliveryLink}
                          rel="noreferrer"
                        >
                          Delivery link
                        </a>
                      ) : null}
                      {!booking.commitmentPayment && !booking.finalPayment ? (
                        <span className={styles.rowMeta}>—</span>
                      ) : null}
                    </td>
                    <td className={styles.actionsCell}>
                      <RowActions
                        bookingId={booking.id}
                        status={booking.status}
                        studentId={booking.studentId}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </FeedbackProvider>
  );
}
