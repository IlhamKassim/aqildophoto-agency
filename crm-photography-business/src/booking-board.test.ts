import { describe, expect, it } from "vitest";
import { BookingBoard } from "./booking-board";
import { openDatabase } from "./database";
import { TimeSlotBoard } from "./time-slot-board";
import { ConvocationEventRegistry } from "./convocation-event-registry";
import { PackageCatalog } from "./package-catalog";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

function setUpSlot(eventDate: Date = new Date("2026-10-14")) {
  const convocationEvents = new ConvocationEventRegistry(openDatabase(":memory:"));
  const event = convocationEvents.createConvocationEvent({
    university: "Universiti Malaya",
    faculty: "Faculty of Engineering",
    date: eventDate,
    venue: "Dewan Tunku Canselor",
  });
  const timeSlotBoard = new TimeSlotBoard(approvalOf(["photographer-1"]), openDatabase(":memory:"));
  timeSlotBoard.optIn("photographer-1", event.id);
  const slot = timeSlotBoard.defineTimeSlot("photographer-1", event.id, {
    start: new Date("2026-10-14T09:00:00"),
    end: new Date("2026-10-14T09:30:00"),
  });
  const packages = new PackageCatalog(approvalOf(["photographer-1"]), openDatabase(":memory:"));
  const pkg = packages.createPackage("photographer-1", {
    name: "Basic",
    price: 300,
    description: "2hrs, 30 edited photos",
  });
  return { convocationEvents, timeSlotBoard, slot, eventId: event.id, packages, packageId: pkg.id };
}

describe("BookingBoard", () => {
  it("requesting a Booking locks the Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));

    const request = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    expect(request.status).toBe("requested");
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([]);
  });

  it("refuses a second Booking Request against an already-held Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    board.requestBooking("student-1", slot.id, packageId, [], eventId);

    expect(() => board.requestBooking("student-2", slot.id, packageId, [], eventId)).toThrow();
  });

  it("accepting a Booking Request transitions it to accepted", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const request = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    const accepted = board.acceptBookingRequest(request.id);

    expect(accepted.status).toBe("accepted");
  });

  it("rejecting a Booking Request transitions it to rejected and reopens the Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const request = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    const rejected = board.rejectBookingRequest(request.id);

    expect(rejected.status).toBe("rejected");
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("expires a Booking Request past its response deadline and reopens the Time Slot", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard(
      { timeSlots: timeSlotBoard, convocationEvents, packages },
      openDatabase(":memory:"),
      1000,
    );
    const request = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() + 1));

    expect(expired).toEqual([{ ...request, status: "expired" }]);
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("leaves a Booking Request within its response deadline untouched", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard(
      { timeSlots: timeSlotBoard, convocationEvents, packages },
      openDatabase(":memory:"),
      1000,
    );
    const request = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    const expired = board.expireStaleBookingRequests(new Date(request.expiresAt.getTime() - 1));

    expect(expired).toEqual([]);
    expect(timeSlotBoard.listOpenTimeSlots(eventId, "photographer-1")).toEqual([]);
  });

  it("paying the Commitment Payment on an accepted Booking transitions it to committed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.status).toBe("committed");
  });

  it("splits the RM30 Commitment Payment at the default 15% Commission rate", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.commitmentPayment).toMatchObject({
      amount: 30,
      agencyShare: 4.5,
      photographerShare: 25.5,
    });
  });

  it("honors a custom Commission rate", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard(
      { timeSlots: timeSlotBoard, convocationEvents, packages },
      openDatabase(":memory:"),
      undefined,
      0.2,
    );
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);

    const committed = board.payCommitmentPayment(booking.id);

    expect(committed.commitmentPayment).toMatchObject({
      amount: 30,
      agencyShare: 6,
      photographerShare: 24,
    });
  });

  it("refuses to pay the Commitment Payment on a Booking that is not accepted", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    expect(() => board.payCommitmentPayment(booking.id)).toThrow();

    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(() => board.payCommitmentPayment(booking.id)).toThrow();
  });

  it("leaves a freshly committed Booking's payout unreleased", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(board.getBooking(booking.id).payoutReleasedAt).toBeUndefined();
  });

  it("releases a committed Booking's payout once its Convocation Event date has passed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } =
      setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const released = board.releaseEligiblePayouts(new Date("2026-10-15"));

    expect(released.map((b) => b.id)).toEqual([booking.id]);
    expect(board.getBooking(booking.id).payoutReleasedAt).toEqual(new Date("2026-10-15"));
  });

  it("does not release a committed Booking's payout before its Convocation Event date", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } =
      setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const released = board.releaseEligiblePayouts(new Date("2026-10-13"));

    expect(released).toEqual([]);
    expect(board.getBooking(booking.id).payoutReleasedAt).toBeUndefined();
  });

  it("does not touch or error on a Booking that is not committed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } =
      setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    board.requestBooking("student-1", slot.id, packageId, [], eventId);

    expect(() => board.releaseEligiblePayouts(new Date("2026-10-15"))).not.toThrow();
    expect(board.releaseEligiblePayouts(new Date("2026-10-15"))).toEqual([]);
  });

  it("cancelling by Student forfeits the Commitment Payment", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const cancelled = board.cancelByStudent(booking.id);

    expect(cancelled).toMatchObject({
      status: "cancelled",
      cancelledBy: "student",
      refunded: false,
    });
  });

  it("cancelling by Photographer before payout release refunds the Student in full", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const cancelled = board.cancelByPhotographer(booking.id);

    expect(cancelled).toMatchObject({
      status: "cancelled",
      cancelledBy: "photographer",
      refunded: true,
    });
  });

  it("refuses a Photographer cancellation once the payout has already released", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } =
      setUpSlot(new Date("2026-10-14"));
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);
    board.releaseEligiblePayouts(new Date("2026-10-15"));

    expect(() => board.cancelByPhotographer(booking.id)).toThrow();
  });

  it("refuses to cancel a Booking that is not committed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    expect(() => board.cancelByStudent(booking.id)).toThrow();
    expect(() => board.cancelByPhotographer(booking.id)).toThrow();
  });

  it("marking photos ready on a committed Booking transitions it to awaiting_final_payment", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    const ready = board.markPhotosReady(booking.id, "https://drive.google.com/my-photos");

    expect(ready.status).toBe("awaiting_final_payment");
  });

  it("refuses to mark photos ready without a Delivery link", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(() => board.markPhotosReady(booking.id, "")).toThrow();
  });

  it("refuses to return the Delivery link before Final Payment is confirmed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);
    board.markPhotosReady(booking.id, "https://drive.google.com/my-photos");

    expect(() => board.getDeliveryLink(booking.id)).toThrow(/not.*delivered/i);
  });

  it("paying the Final Payment computes total minus Commitment and splits by Commission, transitioning to delivered", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);
    board.markPhotosReady(booking.id, "https://drive.google.com/my-photos");

    const delivered = board.payFinalPayment(booking.id);

    expect(delivered.status).toBe("delivered");
    expect(delivered.finalPayment).toMatchObject({
      amount: 270, // 300 package total - 30 commitment already paid
      agencyShare: 40.5,
      photographerShare: 229.5,
    });
  });

  it("returns the Delivery link after Final Payment is confirmed", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);
    board.markPhotosReady(booking.id, "https://drive.google.com/my-photos");
    board.payFinalPayment(booking.id);

    expect(board.getDeliveryLink(booking.id)).toBe("https://drive.google.com/my-photos");
  });

  it("refuses to pay the Final Payment on a Booking that is not awaiting_final_payment", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);
    board.acceptBookingRequest(booking.id);
    board.payCommitmentPayment(booking.id);

    expect(() => board.payFinalPayment(booking.id)).toThrow();
  });

  it("lists all Bookings regardless of status", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, openDatabase(":memory:"));
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    expect(board.listAllBookings().map((b) => b.id)).toEqual([booking.id]);
  });

  it("survives re-instantiating against the same database connection", () => {
    const { convocationEvents, timeSlotBoard, slot, eventId, packages, packageId } = setUpSlot();
    const db = openDatabase(":memory:");
    const board = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages }, db);
    const booking = board.requestBooking("student-1", slot.id, packageId, [], eventId);

    const reloaded = new BookingBoard(
      { timeSlots: timeSlotBoard, convocationEvents, packages },
      db,
    );

    expect(reloaded.listAllBookings().map((b) => b.id)).toEqual([booking.id]);
  });
});
