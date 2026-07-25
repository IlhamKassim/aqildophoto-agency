export type BookingStatus = "requested" | "accepted" | "rejected" | "expired" | "committed";

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
}

export interface TimeSlotLock {
  lockTimeSlot(timeSlotId: string): void;
  reopenTimeSlot(timeSlotId: string): void;
}

export interface ConvocationEventDateLookup {
  getConvocationEventDate(convocationEventId: string): Date;
}

export interface BookingBoardDeps {
  timeSlots: TimeSlotLock;
  convocationEvents: ConvocationEventDateLookup;
}

const DEFAULT_RESPONSE_DEADLINE_MS = 48 * 60 * 60 * 1000;
const DEFAULT_COMMISSION_RATE = 0.15;
const COMMITMENT_PAYMENT_AMOUNT = 30;

export class BookingBoard {
  private readonly bookings = new Map<string, Booking>();

  constructor(
    private readonly deps: BookingBoardDeps,
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
    this.bookings.set(booking.id, booking);
    return booking;
  }

  acceptBookingRequest(bookingId: string): Booking {
    const booking = this.getInStatusOrThrow(bookingId, "requested");
    booking.status = "accepted";
    return booking;
  }

  rejectBookingRequest(bookingId: string): Booking {
    const booking = this.getInStatusOrThrow(bookingId, "requested");
    booking.status = "rejected";
    this.deps.timeSlots.reopenTimeSlot(booking.timeSlotId);
    return booking;
  }

  expireStaleBookingRequests(now: Date): Booking[] {
    const expired: Booking[] = [];
    for (const booking of this.bookings.values()) {
      if (booking.status === "requested" && booking.expiresAt <= now) {
        booking.status = "expired";
        this.deps.timeSlots.reopenTimeSlot(booking.timeSlotId);
        expired.push(booking);
      }
    }
    return expired;
  }

  payCommitmentPayment(bookingId: string): Booking {
    const booking = this.getInStatusOrThrow(bookingId, "accepted");
    const agencyShare = COMMITMENT_PAYMENT_AMOUNT * this.commissionRate;
    booking.commitmentPayment = {
      amount: COMMITMENT_PAYMENT_AMOUNT,
      agencyShare,
      photographerShare: COMMITMENT_PAYMENT_AMOUNT - agencyShare,
      paidAt: new Date(),
    };
    booking.status = "committed";
    return booking;
  }

  getBooking(bookingId: string): Booking {
    return this.getOrThrow(bookingId);
  }

  releaseEligiblePayouts(now: Date): Booking[] {
    const released: Booking[] = [];
    for (const booking of this.bookings.values()) {
      if (booking.status !== "committed" || booking.payoutReleasedAt) {
        continue;
      }
      const eventDate = this.deps.convocationEvents.getConvocationEventDate(
        booking.convocationEventId,
      );
      if (eventDate <= now) {
        booking.payoutReleasedAt = now;
        released.push(booking);
      }
    }
    return released;
  }

  private getInStatusOrThrow(bookingId: string, expectedStatus: BookingStatus): Booking {
    const booking = this.getOrThrow(bookingId);
    if (booking.status !== expectedStatus) {
      throw new Error(`Booking ${bookingId} is ${booking.status}, not ${expectedStatus}`);
    }
    return booking;
  }

  private getOrThrow(bookingId: string): Booking {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`No Booking found with id ${bookingId}`);
    }
    return booking;
  }
}
