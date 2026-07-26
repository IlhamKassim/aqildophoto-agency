"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { requestBookingAction, type ActionState } from "./actions";
import { useAnnounce } from "./feedback";
import styles from "./bookings.module.css";

/**
 * What can actually be booked right now, as the server sees it: only upcoming
 * Convocation Events, only Photographers opted in to them, only their *open*
 * time slots. Building the choices server-side is what keeps the operator from
 * composing a request the domain layer would reject.
 */
export interface AddOnOption {
  id: string;
  name: string;
  price: number;
}

export interface PackageOption {
  id: string;
  name: string;
  price: number;
  addOns: AddOnOption[];
}

export interface PhotographerOption {
  id: string;
  name: string;
  slots: { id: string; label: string }[];
  packages: PackageOption[];
}

export interface EventOption {
  id: string;
  label: string;
  photographers: PhotographerOption[];
}

const EMPTY: ActionState = {};

export function RequestBookingForm({ events }: { events: EventOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(requestBookingAction, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Each selection narrows the next one, so the three ids are held here rather
  // than left to the DOM — a stale photographer or package from a previous
  // event must not survive the change that invalidated it.
  const [eventId, setEventId] = useState("");
  const [photographerId, setPhotographerId] = useState("");
  const [packageId, setPackageId] = useState("");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [events, eventId],
  );
  const selectedPhotographer = useMemo(
    () => selectedEvent?.photographers.find((p) => p.id === photographerId),
    [selectedEvent, photographerId],
  );
  const selectedPackage = useMemo(
    () => selectedPhotographer?.packages.find((p) => p.id === packageId),
    [selectedPhotographer, packageId],
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setEventId("");
      setPhotographerId("");
      setPackageId("");
      firstFieldRef.current?.focus();
    }
  }, [state.success]);

  // This form owns its own state (it never unmounts), but the operator should
  // read every outcome in one place, so it publishes into the page banner.
  useAnnounce(state);

  const bookable = events.some((event) =>
    event.photographers.some(
      (p) => p.slots.length > 0 && p.packages.length > 0,
    ),
  );

  return (
    <section className={styles.requestPanel}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="request-booking-form"
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
        {open ? "Cancel" : "New Booking Request"}
      </button>

      {open ? (
        <form
          id="request-booking-form"
          ref={formRef}
          action={submit}
          className={styles.requestForm}
        >
          {!bookable ? (
            <p className={styles.hint}>
              Nothing is bookable yet: a Booking Request needs an upcoming
              Convocation Event with an opted-in Photographer who has both an
              open time slot and a Package.
            </p>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="booking-student" className={styles.label}>
              Student identifier
            </label>
            <input
              id="booking-student"
              ref={firstFieldRef}
              name="studentId"
              type="text"
              required
              autoFocus
              autoComplete="off"
              aria-describedby="booking-student-hint"
              className={styles.input}
            />
            <p id="booking-student-hint" className={styles.hint}>
              However the Student is identified to the agency — matric number or
              email.
            </p>
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-event" className={styles.label}>
              Convocation Event
            </label>
            <select
              id="booking-event"
              name="convocationEventId"
              required
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setPhotographerId("");
                setPackageId("");
              }}
              className={styles.input}
            >
              <option value="">Select an event…</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-photographer" className={styles.label}>
              Photographer
            </label>
            <select
              id="booking-photographer"
              value={photographerId}
              onChange={(e) => {
                setPhotographerId(e.target.value);
                setPackageId("");
              }}
              disabled={!selectedEvent}
              className={styles.input}
            >
              <option value="">Select a Photographer…</option>
              {selectedEvent?.photographers.map((photographer) => (
                <option key={photographer.id} value={photographer.id}>
                  {photographer.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-slot" className={styles.label}>
              Time Slot
            </label>
            <select
              id="booking-slot"
              name="timeSlotId"
              required
              disabled={!selectedPhotographer}
              className={styles.input}
            >
              <option value="">Select an open slot…</option>
              {selectedPhotographer?.slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-package" className={styles.label}>
              Package
            </label>
            <select
              id="booking-package"
              name="packageId"
              required
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              disabled={!selectedPhotographer}
              className={styles.input}
            >
              <option value="">Select a Package…</option>
              {selectedPhotographer?.packages.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPackage && selectedPackage.addOns.length > 0 ? (
            <fieldset className={styles.addOns}>
              <legend className={styles.label}>Add-ons</legend>
              {selectedPackage.addOns.map((addOn) => (
                <label key={addOn.id} className={styles.checkbox}>
                  <input type="checkbox" name="addOnIds" value={addOn.id} />
                  {addOn.name}
                </label>
              ))}
            </fieldset>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {pending ? "Recording…" : "Record Booking Request"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
