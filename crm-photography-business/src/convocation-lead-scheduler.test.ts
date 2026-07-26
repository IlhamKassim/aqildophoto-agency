import { describe, expect, it, vi } from "vitest";
import { createConvocationLeadScheduler, type CronLike } from "./convocation-lead-scheduler";
import type { ConvocationLeadScraperRunner } from "./convocation-lead-scraper";
import type { ScraperSource } from "./scraper-source";

function fakeCron(): CronLike & { scheduleCalls: number } {
  const fake = {
    scheduleCalls: 0,
    schedule(_expression: string, _callback: () => void) {
      fake.scheduleCalls += 1;
      return { stop: () => {} };
    },
  };
  return fake;
}

function fakeRunner(): { runAll: ReturnType<typeof vi.fn> } {
  return { runAll: vi.fn().mockResolvedValue(undefined) };
}

describe("createConvocationLeadScheduler", () => {
  it("registers exactly one cron job when started", () => {
    const cron = fakeCron();
    const scheduler = createConvocationLeadScheduler(
      fakeRunner() as unknown as ConvocationLeadScraperRunner,
      [] as ScraperSource[],
      cron,
    );

    scheduler.start();

    expect(cron.scheduleCalls).toBe(1);
  });

  it("starting twice does not register a duplicate cron job", () => {
    const cron = fakeCron();
    const scheduler = createConvocationLeadScheduler(
      fakeRunner() as unknown as ConvocationLeadScraperRunner,
      [] as ScraperSource[],
      cron,
    );

    scheduler.start();
    scheduler.start();

    expect(cron.scheduleCalls).toBe(1);
  });

  it("runNow triggers the scraper runner against the registered sources immediately", async () => {
    const runner = fakeRunner();
    const sources = [{ id: "um", name: "UM", fetchCandidates: async () => [] }] as ScraperSource[];
    const scheduler = createConvocationLeadScheduler(
      runner as unknown as ConvocationLeadScraperRunner,
      sources,
      fakeCron(),
    );

    await scheduler.runNow();

    expect(runner.runAll).toHaveBeenCalledWith(sources);
  });
});
