export type BookingStatus = "requested" | "accepted" | "rejected" | "expired";

export interface Booking {
  id: string;
  studentId: string;
  timeSlotId: string;
  packageId: string;
  addOnIds: string[];
  status: BookingStatus;
  requestedAt: Date;
  expiresAt: Date;
}

export interface TimeSlotLock {
  lockTimeSlot(timeSlotId: string): void;
  reopenTimeSlot(timeSlotId: string): void;
}

export interface BookingBoardDeps {
  timeSlots: TimeSlotLock;
}

const DEFAULT_RESPONSE_DEADLINE_MS = 48 * 60 * 60 * 1000;

export class BookingBoard {
  private readonly bookings = new Map<string, Booking>();

  constructor(
    private readonly deps: BookingBoardDeps,
    private readonly responseDeadlineMs: number = DEFAULT_RESPONSE_DEADLINE_MS,
  ) {}

  requestBooking(
    studentId: string,
    timeSlotId: string,
    packageId: string,
    addOnIds: string[],
  ): Booking {
    this.deps.timeSlots.lockTimeSlot(timeSlotId);
    const requestedAt = new Date();
    const booking: Booking = {
      id: crypto.randomUUID(),
      studentId,
      timeSlotId,
      packageId,
      addOnIds,
      status: "requested",
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + this.responseDeadlineMs),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  acceptBookingRequest(bookingId: string): Booking {
    const booking = this.getRequestedOrThrow(bookingId);
    booking.status = "accepted";
    return booking;
  }

  rejectBookingRequest(bookingId: string): Booking {
    const booking = this.getRequestedOrThrow(bookingId);
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

  private getRequestedOrThrow(bookingId: string): Booking {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`No Booking found with id ${bookingId}`);
    }
    if (booking.status !== "requested") {
      throw new Error(`Booking ${bookingId} is ${booking.status}, not requested`);
    }
    return booking;
  }
}
