import { describe, expect, it } from "vitest";
import { MarketplaceBrowser } from "./marketplace-browser.js";
import { openDatabase } from "./database.js";
import { ConvocationEventRegistry } from "./convocation-event-registry.js";
import { TimeSlotBoard } from "./time-slot-board.js";
import { PackageCatalog } from "./package-catalog.js";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

describe("MarketplaceBrowser", () => {
  it("browses upcoming Convocation Events", () => {
    const convocationEvents = new ConvocationEventRegistry(openDatabase(":memory:"));
    const event = convocationEvents.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });
    const browser = new MarketplaceBrowser({
      convocationEvents,
      timeSlotBoard: new TimeSlotBoard(approvalOf([])),
      packageCatalog: new PackageCatalog(approvalOf([])),
      photographerApproval: approvalOf([]),
    });

    const events = browser.browseConvocationEvents(new Date("2026-07-25"));

    expect(events).toContainEqual(event);
  });

  it("browses opted-in, approved Photographers for an event with their Packages and Add-ons", () => {
    const convocationEvents = new ConvocationEventRegistry(openDatabase(":memory:"));
    const approval = approvalOf(["photographer-1"]);
    const timeSlotBoard = new TimeSlotBoard(approval);
    const packageCatalog = new PackageCatalog(approval);
    timeSlotBoard.optIn("photographer-1", "event-1");
    const pkg = packageCatalog.createPackage("photographer-1", {
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });
    const browser = new MarketplaceBrowser({
      convocationEvents,
      timeSlotBoard,
      packageCatalog,
      photographerApproval: approval,
    });

    const listings = browser.browsePhotographersForEvent("event-1");

    expect(listings).toEqual([
      {
        photographerId: "photographer-1",
        packages: [{ ...pkg, addOns: [] }],
      },
    ]);
  });

  it("excludes an opted-in Photographer who is not approved", () => {
    const convocationEvents = new ConvocationEventRegistry(openDatabase(":memory:"));
    const approvedIds = ["photographer-1"];
    const approval = approvalOf(approvedIds);
    const timeSlotBoard = new TimeSlotBoard(approval);
    const packageCatalog = new PackageCatalog(approval);
    timeSlotBoard.optIn("photographer-1", "event-1");
    approvedIds.length = 0; // simulate approval being revoked after opt-in
    const browser = new MarketplaceBrowser({
      convocationEvents,
      timeSlotBoard,
      packageCatalog,
      photographerApproval: approval,
    });

    expect(browser.browsePhotographersForEvent("event-1")).toEqual([]);
  });

  it("browses open Time Slots for an event and Photographer", () => {
    const convocationEvents = new ConvocationEventRegistry(openDatabase(":memory:"));
    const approval = approvalOf(["photographer-1"]);
    const timeSlotBoard = new TimeSlotBoard(approval);
    const packageCatalog = new PackageCatalog(approval);
    timeSlotBoard.optIn("photographer-1", "event-1");
    const slot = timeSlotBoard.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });
    const browser = new MarketplaceBrowser({
      convocationEvents,
      timeSlotBoard,
      packageCatalog,
      photographerApproval: approval,
    });

    const slots = browser.browseOpenTimeSlots("event-1", "photographer-1");

    expect(slots).toEqual([slot]);
  });
});
