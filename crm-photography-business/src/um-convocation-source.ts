import * as cheerio from "cheerio";
import type { LeadCandidate, ScraperSource } from "./scraper-source";

const UM_IMPORTANT_DATES_URL = "https://umconvo.um.edu.my/important-dates-2026";

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Reads the *start* of a range like "17 - 26 Nov 2026" or a single "16 Oct 2026". */
function parseDateRangeStart(text: string): Date | undefined {
  const match = text.match(/(\d{1,2})\s*(?:-\s*\d{1,2})?\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!match) {
    return undefined;
  }
  const [, day, monthName, year] = match;
  if (!day || !monthName || !year) {
    return undefined;
  }
  const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
  if (month === undefined) {
    return undefined;
  }
  return new Date(Number(year), month, Number(day));
}

/**
 * UM publishes its Convocation Ceremony date on this page as one row of a
 * single HTML table (verified 2026-07-26 — see src/fixtures/um-important-dates-2026.html
 * for the structure this was checked against). Every other row is a
 * different graduate milestone (attire collection, briefing, etc.) and is
 * deliberately ignored.
 */
export function parseUmImportantDates(html: string): LeadCandidate[] {
  const $ = cheerio.load(html);
  const candidates: LeadCandidate[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().trim())
      .get();
    const [, info, dateAndTime, location] = cells;
    if (!info || !/convocation ceremony\s+\d{4}/i.test(info)) {
      return;
    }
    const date = parseDateRangeStart(dateAndTime ?? "");
    if (!date) {
      return;
    }
    candidates.push({
      university: "Universiti Malaya",
      date,
      venue: location || undefined,
    });
  });

  return candidates;
}

export function createUniversitiMalayaSource(): ScraperSource {
  return {
    id: "um",
    name: "Universiti Malaya",
    async fetchCandidates(): Promise<LeadCandidate[]> {
      const response = await fetch(UM_IMPORTANT_DATES_URL);
      if (!response.ok) {
        throw new Error(
          `Universiti Malaya convocation page returned HTTP ${response.status}`,
        );
      }
      return parseUmImportantDates(await response.text());
    },
  };
}
