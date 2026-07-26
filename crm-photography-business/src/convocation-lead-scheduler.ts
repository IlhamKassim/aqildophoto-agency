import nodeCron from "node-cron";
import type { ConvocationLeadScraperRunner } from "./convocation-lead-scraper";
import type { ScraperSource } from "./scraper-source";

export interface CronLike {
  schedule(expression: string, callback: () => void): { stop(): void };
}

const DAILY_AT_MIDNIGHT = "0 0 * * *";

export interface ConvocationLeadScheduler {
  /** Registers the daily cron job. Safe to call more than once — a no-op after the first call. */
  start(): void;
  /** Runs the scrape immediately, bypassing the cron schedule — for local/manual verification. */
  runNow(): Promise<void>;
}

export function createConvocationLeadScheduler(
  runner: ConvocationLeadScraperRunner,
  sources: ScraperSource[],
  cron: CronLike = nodeCron,
): ConvocationLeadScheduler {
  let started = false;

  function runNow(): Promise<void> {
    return runner.runAll(sources);
  }

  function start(): void {
    if (started) {
      return;
    }
    started = true;
    cron.schedule(DAILY_AT_MIDNIGHT, () => {
      void runNow();
    });
  }

  return { start, runNow };
}
