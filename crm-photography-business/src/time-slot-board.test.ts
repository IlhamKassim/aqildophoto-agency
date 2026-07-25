import { describe, expect, it } from "vitest";
import { TimeSlotBoard } from "./time-slot-board.js";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

describe("TimeSlotBoard", () => {
  it("lets an approved Photographer opt in to a Convocation Event", () => {
    const board = new TimeSlotBoard(approvalOf(["photographer-1"]));

    expect(() => board.optIn("photographer-1", "event-1")).not.toThrow();
  });

  it("refuses to opt in a Photographer who is not approved", () => {
    const board = new TimeSlotBoard(approvalOf([]));

    expect(() => board.optIn("photographer-1", "event-1")).toThrow();
  });

  it("lets an opted-in Photographer define an open Time Slot", () => {
    const board = new TimeSlotBoard(approvalOf(["photographer-1"]));
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
    const board = new TimeSlotBoard(approvalOf(["photographer-1"]));

    expect(() =>
      board.defineTimeSlot("photographer-1", "event-1", {
        start: new Date("2026-10-14T09:00:00"),
        end: new Date("2026-10-14T09:30:00"),
      }),
    ).toThrow();
  });
});
