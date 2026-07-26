import { describe, expect, it } from "vitest";
import { ConvocationLeadRegistry } from "./convocation-lead-registry";
import { openDatabase } from "./database";

function setUp() {
  return new ConvocationLeadRegistry(openDatabase(":memory:"));
}

describe("ConvocationLeadRegistry", () => {
  it("adds a Convocation Lead with the given details", () => {
    const registry = setUp();

    const lead = registry.addLead({
      university: "Universiti Malaya",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    expect(lead).toMatchObject({
      university: "Universiti Malaya",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
      dismissed: false,
    });
    expect(lead.id).toBeTruthy();
  });

  it("adds a Convocation Lead with no venue", () => {
    const registry = setUp();

    const lead = registry.addLead({
      university: "Universiti Malaya",
      date: new Date("2026-10-14"),
    });

    expect(lead.venue).toBeUndefined();
  });

  it("lists leads within the next 6 months, ordered by date ascending", () => {
    const registry = setUp();
    const now = new Date("2026-07-26");
    const later = registry.addLead({ university: "USM", date: new Date("2026-12-01") });
    const sooner = registry.addLead({ university: "UM", date: new Date("2026-08-01") });

    const leads = registry.listUpcomingLeads(now);

    expect(leads.map((lead) => lead.id)).toEqual([sooner.id, later.id]);
  });

  it("excludes leads more than 6 months out", () => {
    const registry = setUp();
    const now = new Date("2026-07-26");
    registry.addLead({ university: "Too Far Out University", date: new Date("2027-06-01") });

    expect(registry.listUpcomingLeads(now)).toHaveLength(0);
  });

  it("excludes leads whose date has already passed", () => {
    const registry = setUp();
    const now = new Date("2026-07-26");
    registry.addLead({ university: "Already Passed University", date: new Date("2026-01-01") });

    expect(registry.listUpcomingLeads(now)).toHaveLength(0);
  });

  it("excludes dismissed leads from the upcoming list", () => {
    const registry = setUp();
    const now = new Date("2026-07-26");
    const lead = registry.addLead({ university: "UM", date: new Date("2026-08-01") });

    registry.dismissLead(lead.id);

    expect(registry.listUpcomingLeads(now)).toHaveLength(0);
  });

  it("does not add a duplicate lead for the same university and date", () => {
    const registry = setUp();
    const first = registry.addLead({
      university: "Universiti Malaya",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    const second = registry.addLead({
      university: "Universiti Malaya",
      date: new Date("2026-10-14"),
      venue: "Dewan Tunku Canselor",
    });

    expect(second).toEqual(first);
    expect(registry.listUpcomingLeads(new Date("2026-07-26"))).toHaveLength(1);
  });

  it("does not re-add a duplicate lead that was already dismissed", () => {
    const registry = setUp();
    const lead = registry.addLead({ university: "UM", date: new Date("2026-08-01") });
    registry.dismissLead(lead.id);

    registry.addLead({ university: "UM", date: new Date("2026-08-01") });

    expect(registry.listUpcomingLeads(new Date("2026-07-26"))).toHaveLength(0);
  });

  it("throws when dismissing an unknown lead id", () => {
    const registry = setUp();

    expect(() => registry.dismissLead("does-not-exist")).toThrow();
  });

  it("survives re-instantiating against the same database connection", () => {
    const db = openDatabase(":memory:");
    const registry = new ConvocationLeadRegistry(db);
    const lead = registry.addLead({ university: "UM", date: new Date("2026-08-01") });

    const reloaded = new ConvocationLeadRegistry(db);

    expect(reloaded.listUpcomingLeads(new Date("2026-07-26"))).toEqual([lead]);
  });
});
