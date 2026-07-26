import {
  createConvocationLeadScheduler,
  type ConvocationLeadScheduler,
} from "../../src/convocation-lead-scheduler";
import { allScraperSources } from "../../src/scraper-sources";
import type { Services } from "../../src/services";

declare global {
  // eslint-disable-next-line no-var
  var __convocationLeadScheduler: ConvocationLeadScheduler | undefined;
}

/**
 * Guarded the same way getServices() is: globalThis survives Next.js dev-mode
 * module reloads within the same process, so the daily cron only ever gets
 * registered once (see convocation-lead-scheduler.ts's own start() guard too).
 */
export function getScheduler(services: Services): ConvocationLeadScheduler {
  if (!globalThis.__convocationLeadScheduler) {
    globalThis.__convocationLeadScheduler = createConvocationLeadScheduler(
      services.scraperRunner,
      allScraperSources,
    );
    globalThis.__convocationLeadScheduler.start();
  }
  return globalThis.__convocationLeadScheduler;
}
