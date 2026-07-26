import { NextResponse } from "next/server";
import { getServices } from "../../../lib/services";
import { allScraperSources } from "../../../../src/scraper-sources";

/**
 * Dev/ops-only manual trigger, separate from the daily cron in
 * instrumentation.ts — lets an operator verify scraping works right now
 * (`curl -X POST http://localhost:3000/api/convocation-leads/scrape-now`)
 * instead of waiting up to 24 hours for the schedule to fire.
 */
export async function POST() {
  const services = getServices();
  await services.scraperRunner.runAll(allScraperSources);
  return NextResponse.json({
    leads: services.convocationLeads.listUpcomingLeads(),
    sourceRunStatuses: services.scraperRunner.getSourceRunStatuses(),
  });
}
