import { describe, expect, it } from "vitest";
import { BookingBoard } from "./booking-board.js";
import { TimeSlotBoard } from "./time-slot-board.js";
import { ConvocationEventRegistry } from "./convocation-event-registry.js";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

function setUpSlot(eventDate: Date = new Date("2026-10-14")) {
  const convocationEvents = new ConvocationEventRegistry();
  const event = convocationEvents.createConvocationEvent({
    university: "Universiti Malaya",
    faculty: "Faculty of Engineering",
    date: eventDate,
    venue: "Dewan Tunku Canselor",
  });
  const timeSlotBoard = new TimeSlotBoard(approvalOf(["photographer-1"]));
  timeSlotBoard.optIn("photographer-1", event.id);
  const slot = timeSlotBoard.defineTimeSlot("photographer-1", event.id, {
    start: new Date("2026-10-14T09:00:00"),
    end: new Date("2026-10-14T09:30:00"),
  });
  return { convocationEvents, timeSlotBoard, slot, eventId: event.id };
}

describe("BookingBoard", () => {
  it("requesting a Booking locks the Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });

    const request = board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    expect(request.status).toBe("requested");
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([]);
  });

  it("refuses a second Booking Request against an already-held Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    expect(() => board.requestBooking("student-2", slot.id, "package-1", [], eventId)).toThrow();
  });

  it("accepting a Booking Request transitions it to accepted", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const request = board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    const accepted = board.acceptBookingRequest(request.id);

    expect(accepted.status).toBe("accepted");
  });

  it("rejecting a Booking Request transitions it to rejected and reopens the Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const request = board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    const rejected = board.rejectBookingRequest(request.id);

    expect(rejected.status).toBe("rejected");
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("expires a Booking Request past its response deadline and reopens the Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents }, 1000);
    const request = board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() + 1));

    expect(expired).toEqual([{ ...request, status: "expired" }]);
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("leaves a Booking Request within its response deadline untouched", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents }, 1000);
    const request = board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() - 1));

    expect(expired).toEqual([]);
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([]);
  });

  it("paying the Commitment Payment on an accepted Booking transitions it to committed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.status).toBe("committed");
  });

  it("splits the RM30 Commitment Payment at the default 15% Commission rate", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.commitmentPayment).toMatchObject({
      amount: 30,
      agencyShare: 4.5,
      photographerShare: 25.5,
    });
  });

  it("honors a custom Commission rate", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents }, undefined, 0.2);
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.commitmentPayment).toMatchObject({
      amount: 30,
      agencyShare: 6,
      photographerShare: 24,
    });
  });

  it("refuses to pay the Commitment Payment on a Booking that is not accepted", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    expect(() => board.payCommitmentPayment(booking.id)).toThrow();

    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(() => board.payCommitmentPayment(booking.id)).toThrow();
  });

  it("leaves a freshly committed Booking's payout unreleased", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(board.getBooking(booking.id).payoutReleasedAt).toBeUndefined();
  });

  it("releases a committed Booking's payout once its Convocation Event date has passed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const released = board.releaseEligiblePayouts(new Date("2026-10-15"));

    expect(released.map((b) => b.id)).toEqual([booking.id]);
    expect(board.getBooking(booking.id).payoutReleasedAt).toEqual(new Date("2026-10-15"));
  });

  it("does not release a committed Booking's payout before its Convocation Event date", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    const booking = board.requestBooking("student-1", slot.id, "package-1", [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const released = board.releaseEligiblePayouts(new Date("2026-10-13"));

    expect(released).toEqual([]);
    expect(board.getBooking(booking.id).payoutReleasedAt).toBeUndefined();
  });

  it("does not touch or error on a Booking that is not committed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId } = setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents });
    board.requestBooking("student-1", slot.id, "package-1", [], eventId);

    expect(() => board.releaseEligiblePayouts(new Date("2026-10-15"))).not.toThrow();
    expect(board.releaseEligiblePayouts(new Date("2026-10-15"))).toEqual([]);
  });
});
