import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseUnimasConvocationDates } from "./unimas-convocation-source";

const FIXTURE_PATH = path.join(import.meta.dirname, "fixtures/unimas-convocation-2026.html");

function loadFixture(): string {
  return readFileSync(FIXTURE_PATH, "utf-8");
}

describe("parseUnimasConvocationDates", () => {
  it("extracts the convocation date and venue from the addon block", () => {
    const candidates = parseUnimasConvocationDates(loadFixture());

    expect(candidates).toEqual([
      {
        university: "Universiti Malaysia Sarawak",
        date: new Date(2026, 10, 2),
        venue: "Arena Gemilang, DeTAR PUTRA",
      },
    ]);
  });

  it("ignores unrelated addon blocks that don't contain a date paragraph", () => {
    const candidates = parseUnimasConvocationDates(loadFixture());

    expect(candidates).toHaveLength(1);
  });

  it("returns an empty array when no addon block has a parseable date", () => {
    const html = '<div class="sppb-addon-content"><p>Penting Konvokesyen</p></div>';

    expect(parseUnimasConvocationDates(html)).toEqual([]);
  });
});
