import { describe, expect, it } from "vitest";
import { ConvocationEventRegistry } from "./convocation-event-registry";
import { openDatabase } from "./database";

function setUp() {
  return new ConvocationEventRegistry(openDatabase(":memory:"));
}

describe("ConvocationEventRegistry", () => {
  it("creates a Convocation Event with the given details", () => {
    const registry = setUp();

    const event = registry.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    expect(event).toMatchObject({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });
    expect(event.id).toBeTruthy();
  });

  it("lists events whose date has not yet passed", () => {
    const registry = setUp();
    const upcoming = registry.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    const events = registry.listUpcomingConvocationEvents(new Date("2026-07-25"));

    expect(events).toContainEqual(upcoming);
  });

  it("excludes events whose date has already passed", () => {
    const registry = setUp();
    registry.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2025-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    const events = registry.listUpcomingConvocationEvents(new Date("2026-07-25"));

    expect(events).toHaveLength(0);
  });

  it("gets a Convocation Event's date by id", () => {
    const registry = setUp();
    const event = registry.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    expect(registry.getConvocationEventDate(event.id)).toEqual(new Date("2026-10-14"));
  });

  it("survives re-instantiating against the same database connection", () => {
    const db = openDatabase(":memory:");
    const registry = new ConvocationEventRegistry(db);
    const event = registry.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    const reloaded = new ConvocationEventRegistry(db);

    expect(reloaded.listUpcomingConvocationEvents(new Date("2026-01-01"))).toEqual([event]);
  });
});
