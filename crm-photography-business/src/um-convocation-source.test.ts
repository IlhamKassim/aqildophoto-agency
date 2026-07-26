import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseUmImportantDates } from "./um-convocation-source";

const FIXTURE_PATH = path.join(import.meta.dirname, "fixtures/um-important-dates-2026.html");

function loadFixture(): string {
  return readFileSync(FIXTURE_PATH, "utf-8");
}

describe("parseUmImportantDates", () => {
  it("extracts only the Convocation Ceremony row as a Lead candidate", () => {
    const candidates = parseUmImportantDates(loadFixture());

    expect(candidates).toEqual([
      {
        university: "Universiti Malaya",
        date: new Date(2026, 10, 17),
        venue: "Dewan Tunku Canselor, Universiti Malaya",
      },
    ]);
  });

  it("ignores milestone rows that aren't the Convocation Ceremony itself", () => {
    const candidates = parseUmImportantDates(loadFixture());

    expect(candidates.some((candidate) => candidate.date.getMonth() === 9)).toBe(false);
  });

  it("returns an empty array when the table has no Convocation Ceremony row", () => {
    const html = "<table><tr><td>1</td><td>Unrelated milestone</td><td>1 Jan 2026</td><td>Somewhere</td></tr></table>";

    expect(parseUmImportantDates(html)).toEqual([]);
  });
});
