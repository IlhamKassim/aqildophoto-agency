import { describe, expect, it } from "vitest";
import { AgencyDashboard } from "./agency-dashboard.js";
import { BookingBoard } from "./booking-board.js";
import { TimeSlotBoard } from "./time-slot-board.js";
import { ConvocationEventRegistry } from "./convocation-event-registry.js";
import { PackageCatalog } from "./package-catalog.js";
import { PhotographerRegistry } from "./photographer-registry.js";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

function setUpBookingBoard() {
  const convocationEvents = new ConvocationEventRegistry();
  const event = convocationEvents.createConvocationEvent({
    university: "Universiti Malaya",
    faculty: "Faculty of Engineering",
    date: new Date("2026-10-14"),
    venue: "Dewan Tunku Canselor",
  });
  const timeSlotBoard = new TimeSlotBoard(approvalOf(["photographer-1"]));
  timeSlotBoard.optIn("photographer-1", event.id);
  const slot = timeSlotBoard.defineTimeSlot("photographer-1", event.id, {
    start: new Date("2026-10-14T09:00:00"),
    end: new Date("2026-10-14T09:30:00"),
  });
  const packages = new PackageCatalog(approvalOf(["photographer-1"]));
  const pkg = packages.createPackage("photographer-1", {
    name: "Basic",
    price: 300,
    description: "2hrs, 30 edited photos",
  });
  const bookings = new BookingBoard({ timeSlots: timeSlotBoard, convocationEvents, packages });
  return { bookings, slot, eventId: event.id, packageId: pkg.id };
}

describe("AgencyDashboard", () => {
  it("delegates listBookings to the BookingBoard", () => {
    const { bookings, slot, eventId, packageId } = setUpBookingBoard();
    const booking = bookings.requestBooking("student-1", slot.id, packageId, [], eventId);
    const photographers = new PhotographerRegistry();
    const dashboard = new AgencyDashboard({ bookings, photographers });

    expect(dashboard.listBookings().map((b) => b.id)).toEqual([booking.id]);
  });

  it("delegates listPhotographers to the PhotographerRegistry", () => {
    const { bookings } = setUpBookingBoard();
    const photographers = new PhotographerRegistry();
    const photographer = photographers.registerPhotographer({ name: "Aisyah Rahman" });
    const dashboard = new AgencyDashboard({ bookings, photographers });

    expect(dashboard.listPhotographers().map((p) => p.id)).toEqual([photographer.id]);
  });
});
