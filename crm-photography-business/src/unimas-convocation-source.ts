import * as cheerio from "cheerio";
import type { LeadCandidate, ScraperSource } from "./scraper-source";

const UNIMAS_CONVOCATION_URL = "https://www.unimas.my/convocation";

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

/** Reads the *start* of a range like "2-5 November 2026" or a single "2 November 2026". */
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
 * UNIMAS publishes its Convocation date on this page as a Joomla page-builder
 * addon (verified 2026-07-27 — see src/fixtures/unimas-convocation-2026.html
 * for the structure this was checked against): a block with two <p> tags,
 * the first naming the year and venue in <strong> tags, the second holding
 * the date range on its own line. Other addon blocks on the page (nav links,
 * footer text) don't contain a parseable date and are ignored.
 */
export function parseUnimasConvocationDates(html: string): LeadCandidate[] {
  const $ = cheerio.load(html);
  const candidates: LeadCandidate[] = [];

  $(".sppb-addon-content").each((_, block) => {
    const paragraphs = $(block).find("p");
    if (paragraphs.length < 2) {
      return;
    }
    const date = parseDateRangeStart($(paragraphs[1]).text());
    if (!date) {
      return;
    }
    const strongs = $(paragraphs[0])
      .find("strong")
      .map((__, strong) => $(strong).text().trim())
      .get();
    const venue = strongs.find((text) => !/tahun\s+\d{4}/i.test(text));
    candidates.push({
      university: "Universiti Malaysia Sarawak",
      date,
      venue: venue || undefined,
    });
  });

  return candidates;
}

export function createUnimasSource(): ScraperSource {
  return {
    id: "unimas",
    name: "Universiti Malaysia Sarawak",
    async fetchCandidates(): Promise<LeadCandidate[]> {
      const response = await fetch(UNIMAS_CONVOCATION_URL);
      if (!response.ok) {
        throw new Error(
          `Universiti Malaysia Sarawak convocation page returned HTTP ${response.status}`,
        );
      }
      return parseUnimasConvocationDates(await response.text());
    },
  };
}
