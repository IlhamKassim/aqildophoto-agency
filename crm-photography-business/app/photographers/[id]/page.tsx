import Link from "next/link";
import { notFound } from "next/navigation";
import { getServices } from "../../lib/services";
import type { ConvocationEvent } from "../../../src/convocation-event-registry";
import { StatusBadge } from "../status-badge";
import { CreatePackageForm, AddAddOnForm } from "./package-forms";
import { DefineTimeSlotForm, OptInForm } from "./event-forms";
import styles from "./detail.module.css";

// Read SQLite on every request; this screen is a write surface and must never
// be served from a build-time snapshot.
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

const EVENT_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const SLOT_TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const SLOT_DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

function eventLabel(event: ConvocationEvent): string {
  return `${event.university} — ${event.faculty} (${EVENT_DATE.format(event.date)})`;
}

export default async function PhotographerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const services = getServices();

  // The registry exposes no single-Photographer getter, and adding one is out
  // of scope for a UI ticket. The roster is operator-sized, so filtering the
  // full list here costs nothing.
  const photographer = services.photographers
    .listAllPhotographers()
    .find((candidate) => candidate.id === id);

  if (!photographer) {
    notFound();
  }

  const packages = services.packages.listPackagesWithAddOns(photographer.id);

  // Opt-ins are only shown for *upcoming* events. A Photographer's opt-in to a
  // ceremony that has already happened is history, not something to schedule
  // against, and the registry offers no way to list past events anyway.
  const upcoming = services.convocationEvents.listUpcomingConvocationEvents();
  const optedIn = upcoming.filter((event) =>
    services.timeSlots.listOptedInPhotographerIds(event.id).includes(photographer.id),
  );
  const available = upcoming.filter((event) => !optedIn.includes(event));

  // The domain layer refuses Packages and opt-ins for anyone not Approved.
  // Surface that as a precondition rather than as a failed submission, worded
  // per section so the operator isn't told the same thing twice.
  const blocked = photographer.status !== "approved";
  const notApproved = (capability: string) =>
    blocked
      ? `${photographer.name} is ${photographer.status} — only an Approved Photographer can ${capability}.`
      : undefined;

  return (
    <div className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link href="/photographers">Photographers</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{photographer.name}</span>
      </nav>

      <header className={styles.pageHeader}>
        <h1 className={styles.title}>{photographer.name}</h1>
        <StatusBadge status={photographer.status} />
      </header>

      <section aria-labelledby="packages-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 id="packages-heading" className={styles.sectionTitle}>
            Packages
          </h2>
          <p className={styles.sectionMeta}>
            {packages.length} {packages.length === 1 ? "Package" : "Packages"}
          </p>
        </div>

        <CreatePackageForm
          photographerId={photographer.id}
          disabledReason={notApproved("hold Packages")}
        />

        {packages.length === 0 ? (
          <p className={styles.empty}>No Packages listed yet.</p>
        ) : (
          <ul className={styles.cardList}>
            {packages.map((pkg) => (
              <li key={pkg.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{pkg.name}</h3>
                  <span className={styles.price}>{MONEY.format(pkg.price)}</span>
                </div>
                <p className={styles.cardBody}>{pkg.description}</p>

                <h4 className={styles.subheading}>
                  Add-ons
                  <span className={styles.srOnly}> for {pkg.name}</span>
                </h4>
                {pkg.addOns.length === 0 ? (
                  <p className={styles.hint}>No Add-ons on this Package.</p>
                ) : (
                  <ul className={styles.addOnList}>
                    {pkg.addOns.map((addOn) => (
                      <li key={addOn.id} className={styles.addOnItem}>
                        <span>{addOn.name}</span>
                        <span className={styles.price}>
                          {MONEY.format(addOn.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <AddAddOnForm
                  photographerId={photographer.id}
                  packageId={pkg.id}
                  packageName={pkg.name}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="events-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 id="events-heading" className={styles.sectionTitle}>
            Convocation Events
          </h2>
          <p className={styles.sectionMeta}>
            Opted in to {optedIn.length} of {upcoming.length} upcoming
          </p>
        </div>

        <OptInForm
          photographerId={photographer.id}
          options={available.map((event) => ({
            id: event.id,
            label: eventLabel(event),
          }))}
          disabledReason={notApproved("opt into a Convocation Event")}
        />

        {optedIn.length === 0 ? (
          <p className={styles.empty}>
            Not opted in to any upcoming Convocation Event.
          </p>
        ) : (
          <ul className={styles.cardList}>
            {optedIn.map((event) => {
              const slots = services.timeSlots.listOpenTimeSlots(
                event.id,
                photographer.id,
              );
              return (
                <li key={event.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {event.university} — {event.faculty}
                    </h3>
                    <span className={styles.cardMeta}>
                      <time dateTime={event.date.toISOString()}>
                        {EVENT_DATE.format(event.date)}
                      </time>
                    </span>
                  </div>
                  <p className={styles.cardBody}>{event.venue}</p>

                  <h4 className={styles.subheading}>
                    Open Time Slots
                    <span className={styles.srOnly}>
                      {" "}
                      for {event.university} — {event.faculty}
                    </span>
                  </h4>
                  {slots.length === 0 ? (
                    <p className={styles.hint}>No open Time Slots yet.</p>
                  ) : (
                    <ul className={styles.slotList}>
                      {slots
                        .slice()
                        .sort((a, b) => a.start.getTime() - b.start.getTime())
                        .map((slot) => (
                          <li key={slot.id} className={styles.slotItem}>
                            <time dateTime={slot.start.toISOString()}>
                              {SLOT_DAY.format(slot.start)}{" "}
                              {SLOT_TIME.format(slot.start)}
                            </time>
                            <span aria-hidden="true">–</span>
                            <span className={styles.srOnly}>to</span>
                            <time dateTime={slot.end.toISOString()}>
                              {SLOT_TIME.format(slot.end)}
                            </time>
                          </li>
                        ))}
                    </ul>
                  )}

                  <DefineTimeSlotForm
                    photographerId={photographer.id}
                    convocationEventId={event.id}
                    eventLabel={`${event.university} — ${event.faculty}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
