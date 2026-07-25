import { describe, expect, it } from "vitest";
import { BookingBoard } from "./booking-board.js";
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

describe("BookingBoard", () => {
  it("requesting a Booking locks the Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });

    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    expect(request.status).toBe("requested");
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([]);
  });

  it("refuses a second Booking Request against an already-held Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });
    board.requestBooking("student-1", slot.id, "package-1", []);

    expect(() => board.requestBooking("student-2", slot.id, "package-1", [])).toThrow();
  });

  it("accepting a Booking Request transitions it to accepted", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const accepted = board.acceptBookingRequest(request.id);

    expect(accepted.status).toBe("accepted");
  });

  it("rejecting a Booking Request transitions it to rejected and reopens the Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const rejected = board.rejectBookingRequest(request.id);

    expect(rejected.status).toBe("rejected");
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("expires a Booking Request past its response deadline and reopens the Time Slot", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard }, 1000);
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() + 1));

    expect(expired).toEqual([{ ...request, status: "expired" }]);
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("leaves a Booking Request within its response deadline untouched", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard }, 1000);
    const request = board.requestBooking("student-1", slot.id, "package-1", []);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() - 1));

    expect(expired).toEqual([]);
    expect(timeSlotBoard.listOpenTimeSlots("event-1", "photographer-1")).toEqual([]);
  });

  it("paying the Commitment Payment on an accepted Booking transitions it to committed", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });
    const booking = board.requestBooking("student-1", slot.id, "package-1", []);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.status).toBe("committed");
  });

  it("splits the RM30 Commitment Payment at the default 15% Commission rate", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });
    const booking = board.requestBooking("student-1", slot.id, "package-1", []);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.commitmentPayment).toMatchObject({
      amount: 30,
      agencyShare: 4.5,
      photographerShare: 25.5,
    });
  });

  it("honors a custom Commission rate", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard }, undefined, 0.2);
    const booking = board.requestBooking("student-1", slot.id, "package-1", []);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.commitmentPayment).toMatchObject({
      amount: 30,
      agencyShare: 6,
      photographerShare: 24,
    });
  });

  it("refuses to pay the Commitment Payment on a Booking that is not accepted", () => {
    const { timeSlotBoard, slot } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard });
    const booking = board.requestBooking("student-1", slot.id, "package-1", []);

    expect(() => board.payCommitmentPayment(booking.id)).toThrow();

    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(() => board.payCommitmentPayment(booking.id)).toThrow();
  });
});
