import { describe, expect, it } from "vitest";
import { PhotographerRegistry } from "./photographer-registry.js";
import { openDatabase } from "./database.js";

function setUp() {
  return new PhotographerRegistry(openDatabase(":memory:"));
}

describe("PhotographerRegistry", () => {
  it("registers a Photographer with status pending", () => {
    const registry = setUp();

    const photographer = registry.registerPhotographer({ name: "Aisyah Rahman" });

    expect(photographer.status).toBe("pending");
  });

  it("approves a pending Photographer", () => {
    const registry = setUp();
    const photographer = registry.registerPhotographer({ name: "Aisyah Rahman" });

    const approved = registry.approvePhotographer(photographer.id);

    expect(approved.status).toBe("approved");
  });

  it("rejects a pending Photographer", () => {
    const registry = setUp();
    const photographer = registry.registerPhotographer({ name: "Aisyah Rahman" });

    const rejected = registry.rejectPhotographer(photographer.id);

    expect(rejected.status).toBe("rejected");
  });

  it("treats only approved Photographers as isApproved", () => {
    const registry = setUp();
    const pending = registry.registerPhotographer({ name: "Aisyah Rahman" });
    const approved = registry.registerPhotographer({ name: "Bakri Osman" });
    const rejected = registry.registerPhotographer({ name: "Chong Wei" });
    registry.approvePhotographer(approved.id);
    registry.rejectPhotographer(rejected.id);

    expect(registry.isApproved(pending.id)).toBe(false);
    expect(registry.isApproved(approved.id)).toBe(true);
    expect(registry.isApproved(rejected.id)).toBe(false);
    expect(registry.isApproved("unknown-id")).toBe(false);
  });

  it("throws when approving a Photographer that is not pending", () => {
    const registry = setUp();
    const approved = registry.registerPhotographer({ name: "Aisyah Rahman" });
    registry.approvePhotographer(approved.id);
    const rejected = registry.registerPhotographer({ name: "Bakri Osman" });
    registry.rejectPhotographer(rejected.id);

    expect(() => registry.approvePhotographer(approved.id)).toThrow();
    expect(() => registry.approvePhotographer(rejected.id)).toThrow();
  });

  it("throws when rejecting a Photographer that is not pending", () => {
    const registry = setUp();
    const approved = registry.registerPhotographer({ name: "Aisyah Rahman" });
    registry.approvePhotographer(approved.id);
    const rejected = registry.registerPhotographer({ name: "Bakri Osman" });
    registry.rejectPhotographer(rejected.id);

    expect(() => registry.rejectPhotographer(approved.id)).toThrow();
    expect(() => registry.rejectPhotographer(rejected.id)).toThrow();
  });

  it("lists all Photographers regardless of status", () => {
    const registry = setUp();
    const pending = registry.registerPhotographer({ name: "Aisyah Rahman" });
    const approved = registry.registerPhotographer({ name: "Bakri Osman" });
    registry.approvePhotographer(approved.id);

    expect(registry.listAllPhotographers().map((p) => p.id)).toEqual([pending.id, approved.id]);
  });

  it("survives re-instantiating against the same database connection", () => {
    const db = openDatabase(":memory:");
    const registry = new PhotographerRegistry(db);
    const photographer = registry.registerPhotographer({ name: "Aisyah Rahman" });

    const reloaded = new PhotographerRegistry(db);

    expect(reloaded.listAllPhotographers().map((p) => p.id)).toEqual([photographer.id]);
  });
});
