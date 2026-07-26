import { describe, expect, it } from "vitest";
import { TimeSlotBoard } from "./time-slot-board";
import { openDatabase } from "./database";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

function setUp(approvedIds: string[]) {
  return new TimeSlotBoard(approvalOf(approvedIds), openDatabase(":memory:"));
}

describe("TimeSlotBoard", () => {
  it("lets an approved Photographer opt in to a Convocation Event", () => {
    const board = setUp(["photographer-1"]);

    expect(() => board.optIn("photographer-1", "event-1")).not.toThrow();
  });

  it("refuses to opt in a Photographer who is not approved", () => {
    const board = setUp([]);

    expect(() => board.optIn("photographer-1", "event-1")).toThrow();
  });

  it("lets an opted-in Photographer define an open Time Slot", () => {
    const board = setUp(["photographer-1"]);
    board.optIn("photographer-1", "event-1");

    const slot = board.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });

    expect(slot).toMatchObject({
      photographerId: "photographer-1",
      convocationEventId: "event-1",
      status: "open",
    });
  });

  it("refuses to define a Time Slot for an event the Photographer has not opted into", () => {
    const board = setUp(["photographer-1"]);

    expect(() =>
      board.defineTimeSlot("photographer-1", "event-1", {
        start: new Date("2026-10-14T09:00:00"),
        end: new Date("2026-10-14T09:30:00"),
      }),
    ).toThrow();
  });

  it("refuses to define a Time Slot whose end is not after its start", () => {
    const board = setUp(["photographer-1"]);
    board.optIn("photographer-1", "event-1");

    expect(() =>
      board.defineTimeSlot("photographer-1", "event-1", {
        start: new Date("2026-10-14T09:30:00"),
        end: new Date("2026-10-14T09:00:00"),
      }),
    ).toThrow();
  });

  it("lists the Photographer ids opted in to a Convocation Event", () => {
    const board = setUp(["photographer-1", "photographer-2"]);
    board.optIn("photographer-1", "event-1");
    board.optIn("photographer-2", "event-2");

    expect(board.listOptedInPhotographerIds("event-1")).toEqual(["photographer-1"]);
  });

  it("lists open Time Slots for a Convocation Event and Photographer", () => {
    const board = setUp(["photographer-1"]);
    board.optIn("photographer-1", "event-1");
    const slot = board.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });

    expect(board.listOpenTimeSlots("event-1", "photographer-1")).toEqual([slot]);
  });

  it("locking a Time Slot removes it from the open list", () => {
    const board = setUp(["photographer-1"]);
    board.optIn("photographer-1", "event-1");
    const slot = board.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });

    board.lockTimeSlot(slot.id);

    expect(board.listOpenTimeSlots("event-1", "photographer-1")).toEqual([]);
  });

  it("throws when locking a Time Slot that is not open", () => {
    const board = setUp(["photographer-1"]);
    board.optIn("photographer-1", "event-1");
    const slot = board.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });
    board.lockTimeSlot(slot.id);

    expect(() => board.lockTimeSlot(slot.id)).toThrow();
  });

  it("reopening a Time Slot makes it available again", () => {
    const board = setUp(["photographer-1"]);
    board.optIn("photographer-1", "event-1");
    const slot = board.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });
    board.lockTimeSlot(slot.id);

    board.reopenTimeSlot(slot.id);

    expect(board.listOpenTimeSlots("event-1", "photographer-1")).toEqual([
      { ...slot, status: "open" },
    ]);
  });

  it("survives re-instantiating against the same database connection", () => {
    const db = openDatabase(":memory:");
    const board = new TimeSlotBoard(approvalOf(["photographer-1"]), db);
    board.optIn("photographer-1", "event-1");
    const slot = board.defineTimeSlot("photographer-1", "event-1", {
      start: new Date("2026-10-14T09:00:00"),
      end: new Date("2026-10-14T09:30:00"),
    });

    const reloaded = new TimeSlotBoard(approvalOf(["photographer-1"]), db);

    expect(reloaded.listOptedInPhotographerIds("event-1")).toEqual(["photographer-1"]);
    expect(reloaded.listOpenTimeSlots("event-1", "photographer-1")).toEqual([slot]);
  });
});
