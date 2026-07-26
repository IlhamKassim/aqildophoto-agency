import { describe, expect, it } from "vitest";
import { createServices } from "./services";

describe("createServices", () => {
  it("wires all modules correctly for an end-to-end booking flow", () => {
    const services = createServices(":memory:");

    const photographer = services.photographers.registerPhotographer({ name: "Aisyah Rahman" });
    services.photographers.approvePhotographer(photographer.id);
    const event = services.convocationEvents.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });
    services.timeSlots.optIn(photographer.id, event.id);
    const slot = services.timeSlots.defineTimeSlot(photographer.id, event.id, {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });
    const pkg = services.packages.createPackage(photographer.id, {
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });

    const booking = services.bookings.requestBooking(
      "student-1",
      slot.id,
      pkg.id,
      [],
      event.id,
    );
    services.bookings.acceptBookingRequest(booking.id);
    const committed = services.bookings.payCommitmentPayment(booking.id);

    expect(committed.status).toBe("committed");
    expect(services.dashboard.listBookings().map((b) => b.id)).toEqual([booking.id]);
    expect(services.dashboard.listPhotographers().map((p) => p.id)).toEqual([photographer.id]);
  });
});
