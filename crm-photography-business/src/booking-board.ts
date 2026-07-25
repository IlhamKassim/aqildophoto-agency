import type Database from "better-sqlite3";

export type BookingStatus =
  | "requested"
  | "accepted"
  | "rejected"
  | "expired"
  | "committed"
  | "cancelled"
  | "awaiting_final_payment"
  | "delivered";

export interface CommissionSplit {
  amount: number;
  agencyShare: number;
  photographerShare: number;
  paidAt: Date;
}

export interface Booking {
  id: string;
  studentId: string;
  timeSlotId: string;
  packageId: string;
  addOnIds: string[];
  convocationEventId: string;
  status: BookingStatus;
  requestedAt: Date;
  expiresAt: Date;
  commitmentPayment?: CommissionSplit;
  payoutReleasedAt?: Date;
  cancelledBy?: "student" | "photographer";
  cancelledAt?: Date;
  refunded?: boolean;
  finalPayment?: CommissionSplit;
}

export interface TimeSlotLock {
  lockTimeSlot(timeSlotId: string): void;
  reopenTimeSlot(timeSlotId: string): void;
}

export interface ConvocationEventDateLookup {
  getConvocationEventDate(convocationEventId: string): Date;
}

export interface PackagePricing {
  getTotalPrice(packageId: string, addOnIds: string[]): number;
}

export interface BookingBoardDeps {
  timeSlots: TimeSlotLock;
  convocationEvents: ConvocationEventDateLookup;
  packages: PackagePricing;
}

interface BookingRow {
  id: string;
  student_id: string;
  time_slot_id: string;
  package_id: string;
  add_on_ids: string;
  convocation_event_id: string;
  status: BookingStatus;
  requested_at: string;
  expires_at: string;
  commitment_payment: string | null;
  payout_released_at: string | null;
  cancelled_by: "student" | "photographer" | null;
  cancelled_at: string | null;
  refunded: number | null;
  final_payment: string | null;
  delivery_link: string | null;
}

function serializeSplit(split: CommissionSplit): string {
  return JSON.stringify(split);
}

function deserializeSplit(json: string): CommissionSplit {
  const parsed = JSON.parse(json);
  return { ...parsed, paidAt: new Date(parsed.paidAt) };
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    studentId: row.student_id,
    timeSlotId: row.time_slot_id,
    packageId: row.package_id,
    addOnIds: JSON.parse(row.add_on_ids),
    convocationEventId: row.convocation_event_id,
    status: row.status,
    requestedAt: new Date(row.requested_at),
    expiresAt: new Date(row.expires_at),
    ...(row.commitment_payment ? { commitmentPayment: deserializeSplit(row.commitment_payment) } : {}),
    ...(row.payout_released_at ? { payoutReleasedAt: new Date(row.payout_released_at) } : {}),
    ...(row.cancelled_by ? { cancelledBy: row.cancelled_by } : {}),
    ...(row.cancelled_at ? { cancelledAt: new Date(row.cancelled_at) } : {}),
    ...(row.refunded !== null ? { refunded: row.refunded === 1 } : {}),
    ...(row.final_payment ? { finalPayment: deserializeSplit(row.final_payment) } : {}),
  };
}

const DEFAULT_RESPONSE_DEADLINE_MS = 48 * 60 * 60 * 1000;
const DEFAULT_COMMISSION_RATE = 0.15;
const COMMITMENT_PAYMENT_AMOUNT = 30;

const BOOKING_COLUMNS =
  "id, student_id, time_slot_id, package_id, add_on_ids, convocation_event_id, status, requested_at, expires_at, commitment_payment, payout_released_at, cancelled_by, cancelled_at, refunded, final_payment, delivery_link";

export class BookingBoard {
  constructor(
    private readonly deps: BookingBoardDeps,
    private readonly db: Database.Database,
    private readonly responseDeadlineMs: number = DEFAULT_RESPONSE_DEADLINE_MS,
    private readonly commissionRate: number = DEFAULT_COMMISSION_RATE,
  ) {}

  requestBooking(
    studentId: string,
    timeSlotId: string,
    packageId: string,
    addOnIds: string[],
    convocationEventId: string,
  ): Booking {
    this.deps.timeSlots.lockTimeSlot(timeSlotId);
    const requestedAt = new Date();
    const booking: Booking = {
      id: crypto.randomUUID(),
      studentId,
      timeSlotId,
      packageId,
      addOnIds,
      convocationEventId,
      status: "requested",
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + this.responseDeadlineMs),
    };
    this.db
      .prepare(
        `INSERT INTO bookings (id, student_id, time_slot_id, package_id, add_on_ids, convocation_event_id, status, requested_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        booking.id,
        booking.studentId,
        booking.timeSlotId,
        booking.packageId,
        JSON.stringify(booking.addOnIds),
        booking.convocationEventId,
        booking.status,
        booking.requestedAt.toISOString(),
        booking.expiresAt.toISOString(),
      );
    return booking;
  }

  acceptBookingRequest(bookingId: string): Booking {
    this.getInStatusOrThrow(bookingId, "requested");
    this.setStatus(bookingId, "accepted");
    return this.getOrThrow(bookingId);
  }

  rejectBookingRequest(bookingId: string): Booking {
    const booking = this.getInStatusOrThrow(bookingId, "requested");
    this.setStatus(bookingId, "rejected");
    this.deps.timeSlots.reopenTimeSlot(booking.timeSlotId);
    return this.getOrThrow(bookingId);
  }

  expireStaleBookingRequests(now: Date): Booking[] {
    const rows = this.db
      .prepare(`SELECT ${BOOKING_COLUMNS} FROM bookings WHERE status = 'requested'`)
      .all() as BookingRow[];
    const expired: Booking[] = [];
    for (const booking of rows.map(toBooking)) {
      if (booking.expiresAt <= now) {
        this.setStatus(booking.id, "expired");
        this.deps.timeSlots.reopenTimeSlot(booking.timeSlotId);
        expired.push(this.getOrThrow(booking.id));
      }
    }
    return expired;
  }

  payCommitmentPayment(bookingId: string): Booking {
    this.getInStatusOrThrow(bookingId, "accepted");
    const split = this.computeSplit(COMMITMENT_PAYMENT_AMOUNT);
    this.db
      .prepare("UPDATE bookings SET commitment_payment = ?, status = 'committed' WHERE id = ?")
      .run(serializeSplit(split), bookingId);
    return this.getOrThrow(bookingId);
  }

  getBooking(bookingId: string): Booking {
    return this.getOrThrow(bookingId);
  }

  listAllBookings(): Booking[] {
    const rows = this.db.prepare(`SELECT ${BOOKING_COLUMNS} FROM bookings`).all() as BookingRow[];
    return rows.map(toBooking);
  }

  cancelByStudent(bookingId: string): Booking {
    this.getInStatusOrThrow(bookingId, "committed");
    this.db
      .prepare(
        "UPDATE bookings SET status = 'cancelled', cancelled_by = 'student', cancelled_at = ?, refunded = 0 WHERE id = ?",
      )
      .run(new Date().toISOString(), bookingId);
    return this.getOrThrow(bookingId);
  }

  cancelByPhotographer(bookingId: string): Booking {
    const booking = this.getInStatusOrThrow(bookingId, "committed");
    if (booking.payoutReleasedAt) {
      throw new Error(
        `Booking ${bookingId}'s payout has already released; cancellation refund is not supported past this point`,
      );
    }
    this.db
      .prepare(
        "UPDATE bookings SET status = 'cancelled', cancelled_by = 'photographer', cancelled_at = ?, refunded = 1 WHERE id = ?",
      )
      .run(new Date().toISOString(), bookingId);
    return this.getOrThrow(bookingId);
  }

  releaseEligiblePayouts(now: Date): Booking[] {
    const rows = this.db
      .prepare(
        `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE status = 'committed' AND payout_released_at IS NULL`,
      )
      .all() as BookingRow[];
    const released: Booking[] = [];
    for (const booking of rows.map(toBooking)) {
      const eventDate = this.deps.convocationEvents.getConvocationEventDate(
        booking.convocationEventId,
      );
      if (eventDate <= now) {
        this.db
          .prepare("UPDATE bookings SET payout_released_at = ? WHERE id = ?")
          .run(now.toISOString(), booking.id);
        released.push(this.getOrThrow(booking.id));
      }
    }
    return released;
  }

  markPhotosReady(bookingId: string, deliveryLink: string): Booking {
    if (!deliveryLink) {
      throw new Error("A Delivery link is required to mark photos ready");
    }
    this.getInStatusOrThrow(bookingId, "committed");
    this.db
      .prepare(
        "UPDATE bookings SET delivery_link = ?, status = 'awaiting_final_payment' WHERE id = ?",
      )
      .run(deliveryLink, bookingId);
    return this.getOrThrow(bookingId);
  }

  payFinalPayment(bookingId: string): Booking {
    const booking = this.getInStatusOrThrow(bookingId, "awaiting_final_payment");
    const totalPrice = this.deps.packages.getTotalPrice(booking.packageId, booking.addOnIds);
    const split = this.computeSplit(totalPrice - booking.commitmentPayment!.amount);
    this.db
      .prepare("UPDATE bookings SET final_payment = ?, status = 'delivered' WHERE id = ?")
      .run(serializeSplit(split), bookingId);
    return this.getOrThrow(bookingId);
  }

  getDeliveryLink(bookingId: string): string {
    this.getInStatusOrThrow(bookingId, "delivered");
    const row = this.db
      .prepare("SELECT delivery_link FROM bookings WHERE id = ?")
      .get(bookingId) as { delivery_link: string | null };
    return row.delivery_link!;
  }

  private setStatus(bookingId: string, status: BookingStatus): void {
    this.db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, bookingId);
  }

  private getInStatusOrThrow(bookingId: string, expectedStatus: BookingStatus): Booking {
    const booking = this.getOrThrow(bookingId);
    if (booking.status !== expectedStatus) {
      throw new Error(`Booking ${bookingId} is ${booking.status}, not ${expectedStatus}`);
    }
    return booking;
  }

  private getOrThrow(bookingId: string): Booking {
    const row = this.db
      .prepare(`SELECT ${BOOKING_COLUMNS} FROM bookings WHERE id = ?`)
      .get(bookingId) as BookingRow | undefined;
    if (!row) {
      throw new Error(`No Booking found with id ${bookingId}`);
    }
    return toBooking(row);
  }

  private computeSplit(amount: number): CommissionSplit {
    const agencyShare = amount * this.commissionRate;
    return {
      amount,
      agencyShare,
      photographerShare: amount - agencyShare,
      paidAt: new Date(),
    };
  }
}
