import * as cheerio from "cheerio";
import type { LeadCandidate, ScraperSource } from "./scraper-source";

const UTP_UPCOMING_EVENTS_URL = "https://www.utp.edu.my/Pages/Upcoming-Events.aspx";

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

/**
 * The page's own SharePoint render timestamp, embedded in the
 * `_spPageContextInfo` script blob on every load. Event rows on this page
 * carry only a day + 3-letter month (no year — see parseUtpUpcomingEvents),
 * so this is used to resolve which year each row falls in, instead of
 * reading the system clock at parse time.
 */
function readServerDate(html: string): Date | undefined {
  const match = html.match(/"serverTime":"(\d{4})-(\d{2})-(\d{2})T/);
  if (!match) {
    return undefined;
  }
  const [, year, month, day] = match;
  if (!year || !month || !day) {
    return undefined;
  }
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Resolves a "day + 3-letter month" row against the page's own render date. */
function resolveEventDate(day: string, month: string, serverDate: Date): Date | undefined {
  const monthIndex = MONTHS[month.slice(0, 3).toLowerCase()];
  const dayNum = Number(day);
  if (monthIndex === undefined || !Number.isFinite(dayNum) || dayNum < 1) {
    return undefined;
  }
  const today = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate());
  let candidate = new Date(serverDate.getFullYear(), monthIndex, dayNum);
  // The listing only ever shows events from "today" onward, so a row whose
  // month/day falls before the page's own render date must have rolled over
  // into the next calendar year.
  if (candidate < today) {
    candidate = new Date(serverDate.getFullYear() + 1, monthIndex, dayNum);
  }
  return candidate;
}

/**
 * UTP publishes its Convocation Ceremony as two rows (one per session day)
 * in a SharePoint "Upcoming Events" list (verified 2026-07-27 — see
 * src/fixtures/utp-upcoming-events-2026.html for the structure this was
 * checked against): a `section.sec-event-listing` block holding repeated
 * `section.sec-event-listing-row` blocks, each with a day/month (no year)
 * and an event name. Only rows named "... Convocation Ceremony" are kept;
 * since the ceremony spans two same-named rows (one per session), the
 * earliest is returned as the candidate date, mirroring the "start of a
 * range" convention used by the other sources. Venue isn't available on
 * this listing page — the per-event detail pages require authentication
 * (HTTP 401 when checked) — so it's left unset.
 */
export function parseUtpUpcomingEvents(html: string): LeadCandidate[] {
  const $ = cheerio.load(html);
  const serverDate = readServerDate(html);
  if (!serverDate) {
    return [];
  }

  const dates: Date[] = [];
  $(".sec-event-listing-row").each((_, row) => {
    const name = $(row).find(".sec-event-listing-name").text().trim();
    if (!/convocation ceremony/i.test(name)) {
      return;
    }
    const day = $(row).find(".sec-event-listing-date .day").text().trim();
    const month = $(row).find(".sec-event-listing-date .month").text().trim();
    const date = resolveEventDate(day, month, serverDate);
    if (date) {
      dates.push(date);
    }
  });

  if (dates.length === 0) {
    return [];
  }
  const earliest = dates.reduce((min, date) => (date < min ? date : min));
  return [{ university: "Universiti Teknologi Petronas", date: earliest }];
}

export function createUtpSource(): ScraperSource {
  return {
    id: "utp",
    name: "Universiti Teknologi Petronas",
    async fetchCandidates(): Promise<LeadCandidate[]> {
      const response = await fetch(UTP_UPCOMING_EVENTS_URL);
      if (!response.ok) {
        throw new Error(
          `Universiti Teknologi Petronas convocation page returned HTTP ${response.status}`,
        );
      }
      return parseUtpUpcomingEvents(await response.text());
    },
  };
}
