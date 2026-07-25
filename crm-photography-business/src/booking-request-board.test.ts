import { describe, expect, it } from "vitest";
import { BookingRequestBoard } from "./booking-request-board.js";
import { TimeSlotBoard } from "./time-slot-board.js";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

function setUpSlot() {
  const timeSlotBoard = new TimeSlotBoard(approvalOf(["photographer-1"]));
  timeSlotBoard.optIn("photographer-1", "event-1");
  const slot = timeSlotBoard.defineTimeSlot("photographer-1", "event-1", {
    start: new Date("2026-10-14T09:00:00"),
    end: new Date("2026-10-14T09:30:00"),
  });
  return { timeSlotBoard, slot };
}

describe("BookingRequestBoard", () => {
  it("requesting a Booking locks the Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingRequestBoard({ timeSlots: timeSlotBoard });

    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    expect(request.status).toBe("requested");
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([]);
  });

  it("refuses a second Booking Request against an already-held Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingRequestBoard({ timeSlots: timeSlotBoard });
    board.requestBooking("student-1", slot.id, "package-1", []);

    expect(() => board.requestBooking("student-2", slot.id, "package-1", [])).toThrow();
  });

  it("accepting a Booking Request transitions it to accepted", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingRequestBoard({ timeSlots: timeSlotBoard });
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const accepted = board.acceptBookingRequest(request.id);

    expect(accepted.status).toBe("accepted");
  });

  it("rejecting a Booking Request transitions it to rejected and reopens the Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingRequestBoard({ timeSlots: timeSlotBoard });
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const rejected = board.rejectBookingRequest(request.id);

    expect(rejected.status).toBe("rejected");
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("expires a Booking Request past its response deadline and reopens the Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingRequestBoard({ timeSlots: timeSlotBoard }, 1000);
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() + 1));

    expect(expired).toEqual([{ ...request, status: "expired" }]);
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("leaves a Booking Request within its response deadline untouched", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingRequestBoard({ timeSlots: timeSlotBoard }, 1000);
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() - 1));

    expect(expired).toEqual([]);
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([]);
  });
});
