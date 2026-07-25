import { describe, expect, it } from "vitest";
import { ConvocationEventRegistry } from "./convocation-event-registry.js";

describe("ConvocationEventRegistry", () => {
  it("creates a Convocation Event with the given details", () => {
    const registry = new ConvocationEventRegistry();

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
    const registry = new ConvocationEventRegistry();
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
    const registry = new ConvocationEventRegistry();
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
    const registry = new ConvocationEventRegistry();
    const event = registry.createConvocationEvent({
      university: "Universiti Malaya",
      faculty: "Faculty of Engineering",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    expect(registry.getConvocationEventDate(event.id)).toEqual(new Date("2026-10-14"));
  });
});
