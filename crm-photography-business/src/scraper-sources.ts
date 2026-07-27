import type { ScraperSource } from "./scraper-source";
import { createUniversitiMalayaSource } from "./um-convocation-source";
import { createUnimasSource } from "./unimas-convocation-source";
import { createUtpSource } from "./utp-convocation-source";

/**
 * Registered ScraperSources, one per implemented university. Adding a new
 * university is: write a ScraperSource implementation (see
 * um-convocation-source.ts for the shape — fetch + parse, tested against a
 * captured fixture), then add it to this array. No other file needs to change.
 */
export const allScraperSources: ScraperSource[] = [
  createUniversitiMalayaSource(),
  createUnimasSource(),
  createUtpSource(),
];

/**
 * Malaysia's public universities (IPTA) not yet implemented as a
 * ScraperSource, per PRD.md's scope note — each publishes convocation dates
 * in its own format, and each needs its own verified fetch + parse before
 * being added to `allScraperSources` above. Private institutions (IPTS) are
 * a further, larger, unenumerated list beyond this one.
 */
export const UNIMPLEMENTED_IPTA_UNIVERSITIES = [
  "Universiti Kebangsaan Malaysia (UKM)",
  "Universiti Putra Malaysia (UPM)",
  "Universiti Sains Malaysia (USM)",
  "Universiti Teknologi Malaysia (UTM)",
  "Universiti Islam Antarabangsa Malaysia (UIAM/IIUM)",
  "Universiti Utara Malaysia (UUM)",
  "Universiti Malaysia Sabah (UMS)",
  "Universiti Pendidikan Sultan Idris (UPSI)",
  "Universiti Teknologi MARA (UiTM)",
  "Universiti Sains Islam Malaysia (USIM)",
  "Universiti Malaysia Terengganu (UMT)",
  "Universiti Tun Hussein Onn Malaysia (UTHM)",
  "Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA)",
  "Universiti Malaysia Perlis (UniMAP)",
  "Universiti Teknikal Malaysia Melaka (UTeM)",
  "Universiti Sultan Zainal Abidin (UniSZA)",
  "Universiti Pertahanan Nasional Malaysia (UPNM)",
  "Universiti Malaysia Kelantan (UMK)",
] as const;

/**
 * Malaysia's private universities/university colleges (IPTS) spot-checked
 * for a scrapable convocation-dates page (Ticket 06) and found not currently
 * viable, each with the reason recorded so it isn't re-checked from scratch
 * later. Unlike UNIMPLEMENTED_IPTA_UNIVERSITIES above, this isn't a bounded
 * list of all IPTS institutions — it's just the candidates checked so far;
 * see PRD.md's scope note. Universiti Teknologi Petronas (UTP), the one
 * candidate from this batch found viable, is implemented in
 * utp-convocation-source.ts instead of listed here.
 */
export const UNCONFIRMED_IPTS_UNIVERSITIES = [
  // First 8 IPTS candidates checked (pre-Ticket 06):
  "Taylor's University — date passed",
  "Sunway University — date passed",
  "UCSI University — date passed",
  "University of Nottingham Malaysia — date passed",
  "Heriot-Watt University Malaysia — date passed",
  "Multimedia University (MMU) — no date posted yet",
  "Asia Pacific University (APU) — blocked (login-gated)",
  "Monash University Malaysia — blocked (HTTP 403 etc.)",
  // 12 candidates checked in Ticket 06 (11 non-viable; UTP was viable — see above):
  "Tunku Abdul Rahman University of Management and Technology (TAR UMT) — image/PDF-only (convocation schedule is only published as a PDF booklet, no on-page date text)",
  "Universiti Tenaga Nasional (UNITEN) — date passed (latest confirmed date was Nov 2025; no 2026/2027 date posted)",
  "Curtin University Malaysia — date passed (ceremony was 16-17 Apr 2026)",
  "Swinburne University of Technology Sarawak Campus — blocked (HTTP 403 etc.) (entire domain sits behind a Cloudflare managed challenge)",
  "INTI International University — no date posted yet (latest confirmed convocation on-site was Jul 2025)",
  "SEGi University — no date posted yet (official convocation page is stale from 2019; no current listing)",
  "HELP University — date passed (36th convocation was 10 May 2026; no next date posted)",
  "Management and Science University (MSU) — date passed (37th convocation was 17-18 May 2026; no next date posted)",
  "Xiamen University Malaysia — no date posted yet (only a retrospective news article about a Sep 2025 ceremony)",
  "UOW Malaysia KDU University College — date passed (ceremony was 22-23 Nov 2025)",
  "Limkokwing University of Creative Technology — no date posted yet (no 2025/2026 convocation content found on official site)",
] as const;
