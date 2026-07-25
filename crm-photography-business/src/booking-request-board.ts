export type BookingRequestStatus = "requested" | "accepted" | "rejected" | "expired";

export interface BookingRequest {
  id: string;
  studentId: string;
  timeSlotId: string;
  packageId: string;
  addOnIds: string[];
  status: BookingRequestStatus;
  requestedAt: Date;
  expiresAt: Date;
}

export interface TimeSlotLock {
  lockTimeSlot(timeSlotId: string): void;
  reopenTimeSlot(timeSlotId: string): void;
}

export interface BookingRequestBoardDeps {
  timeSlots: TimeSlotLock;
}

const DEFAULT_RESPONSE_DEADLINE_MS = 48 * 60 * 60 * 1000;

export class BookingRequestBoard {
  private readonly requests = new Map<string, BookingRequest>();

  constructor(
    private readonly deps: BookingRequestBoardDeps,
    private readonly responseDeadlineMs: number = DEFAULT_RESPONSE_DEADLINE_MS,
  ) {}

  requestBooking(
    studentId: string,
    timeSlotId: string,
    packageId: string,
    addOnIds: string[],
  ): BookingRequest {
    this.deps.timeSlots.lockTimeSlot(timeSlotId);
    const requestedAt = new Date();
    const request: BookingRequest = {
      id: crypto.randomUUID(),
      studentId,
      timeSlotId,
      packageId,
      addOnIds,
      status: "requested",
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + this.responseDeadlineMs),
    };
    this.requests.set(request.id, request);
    return request;
  }

  acceptBookingRequest(bookingRequestId: string): BookingRequest {
    const request = this.getRequestedOrThrow(bookingRequestId);
    request.status = "accepted";
    return request;
  }

  rejectBookingRequest(bookingRequestId: string): BookingRequest {
    const request = this.getRequestedOrThrow(bookingRequestId);
    request.status = "rejected";
    this.deps.timeSlots.reopenTimeSlot(request.timeSlotId);
    return request;
  }

  expireStaleBookingRequests(now: Date): BookingRequest[] {
    const expired: BookingRequest[] = [];
    for (const request of this.requests.values()) {
      if (request.status === "requested" && request.expiresAt <= now) {
        request.status = "expired";
        this.deps.timeSlots.reopenTimeSlot(request.timeSlotId);
        expired.push(request);
      }
    }
    return expired;
  }

  private getRequestedOrThrow(bookingRequestId: string): BookingRequest {
    const request = this.requests.get(bookingRequestId);
    if (!request) {
      throw new Error(`No Booking Request found with id ${bookingRequestId}`);
    }
    if (request.status !== "requested") {
      throw new Error(`Booking Request ${bookingRequestId} is ${request.status}, not requested`);
    }
    return request;
  }
}
