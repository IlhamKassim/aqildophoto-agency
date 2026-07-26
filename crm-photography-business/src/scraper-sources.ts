import type { ScraperSource } from "./scraper-source";
import { createUniversitiMalayaSource } from "./um-convocation-source";

/**
 * Registered ScraperSources, one per implemented university. Adding a new
 * university is: write a ScraperSource implementation (see
 * um-convocation-source.ts for the shape — fetch + parse, tested against a
 * captured fixture), then add it to this array. No other file needs to change.
 */
export const allScraperSources: ScraperSource[] = [createUniversitiMalayaSource()];

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
  "Universiti Malaysia Sarawak (UNIMAS)",
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
