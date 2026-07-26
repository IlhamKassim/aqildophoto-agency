import { describe, expect, it } from "vitest";
import { ConvocationLeadScraperRunner } from "./convocation-lead-scraper";
import { ConvocationLeadRegistry } from "./convocation-lead-registry";
import { openDatabase } from "./database";
import type { ScraperSource } from "./scraper-source";

function setUp() {
  const db = openDatabase(":memory:");
  const registry = new ConvocationLeadRegistry(db);
  const runner = new ConvocationLeadScraperRunner(db, registry);
  return { db, registry, runner };
}

function fakeSource(overrides: Partial<ScraperSource> & Pick<ScraperSource, "id" | "name">): ScraperSource {
  return {
    fetchCandidates: async () => [],
    ...overrides,
  };
}

describe("ConvocationLeadScraperRunner", () => {
  it("adds a successful source's candidates as Leads", async () => {
    const { registry, runner } = setUp();
    const source = fakeSource({
      id: "um",
      name: "Universiti Malaya",
      fetchCandidates: async () => [{ university: "Universiti Malaya", date: new Date("2026-10-14") }],
    });

    await runner.runAll([source]);

    expect(registry.listUpcomingLeads(new Date("2026-07-26"))).toHaveLength(1);
  });

  it("records a successful source's status as ok", async () => {
    const { runner } = setUp();
    const source = fakeSource({ id: "um", name: "Universiti Malaya" });

    await runner.runAll([source], new Date("2026-07-26"));

    expect(runner.getSourceRunStatuses()).toContainEqual(
      expect.objectContaining({ sourceId: "um", status: "ok", ranAt: new Date("2026-07-26") }),
    );
  });

  it("records zero candidates as ok, not failed", async () => {
    const { runner } = setUp();
    const source = fakeSource({ id: "um", name: "Universiti Malaya" });

    await runner.runAll([source]);

    const [status] = runner.getSourceRunStatuses();
    expect(status?.status).toBe("ok");
  });

  it("records a rejecting source's status as failed, with a reason", async () => {
    const { runner } = setUp();
    const source = fakeSource({
      id: "ukm",
      name: "UKM",
      fetchCandidates: async () => {
        throw new Error("site unreachable");
      },
    });

    await runner.runAll([source]);

    expect(runner.getSourceRunStatuses()).toContainEqual(
      expect.objectContaining({ sourceId: "ukm", status: "failed", reason: "site unreachable" }),
    );
  });

  it("records a synchronously-throwing source's status as failed", async () => {
    const { runner } = setUp();
    const source: ScraperSource = {
      id: "upm",
      name: "UPM",
      fetchCandidates: (): Promise<never> => {
        throw new Error("boom");
      },
    };

    await runner.runAll([source]);

    expect(runner.getSourceRunStatuses()).toContainEqual(
      expect.objectContaining({ sourceId: "upm", status: "failed", reason: "boom" }),
    );
  });

  it("one source failing does not stop the others from running", async () => {
    const { registry, runner } = setUp();
    const failing = fakeSource({
      id: "ukm",
      name: "UKM",
      fetchCandidates: async () => {
        throw new Error("boom");
      },
    });
    const succeeding = fakeSource({
      id: "um",
      name: "UM",
      fetchCandidates: async () => [{ university: "UM", date: new Date("2026-10-14") }],
    });

    await runner.runAll([failing, succeeding]);

    expect(registry.listUpcomingLeads(new Date("2026-07-26"))).toHaveLength(1);
    const statuses = runner.getSourceRunStatuses();
    expect(statuses.find((status) => status.sourceId === "ukm")?.status).toBe("failed");
    expect(statuses.find((status) => status.sourceId === "um")?.status).toBe("ok");
  });

  it("survives re-instantiating against the same database connection", async () => {
    const db = openDatabase(":memory:");
    const registry = new ConvocationLeadRegistry(db);
    const runner = new ConvocationLeadScraperRunner(db, registry);
    await runner.runAll([fakeSource({ id: "um", name: "UM" })], new Date("2026-07-26"));

    const reloaded = new ConvocationLeadScraperRunner(db, registry);

    expect(reloaded.getSourceRunStatuses()).toHaveLength(1);
  });
});
