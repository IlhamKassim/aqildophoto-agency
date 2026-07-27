import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseUtpUpcomingEvents } from "./utp-convocation-source";

const FIXTURE_PATH = path.join(import.meta.dirname, "fixtures/utp-upcoming-events-2026.html");

function loadFixture(): string {
  return readFileSync(FIXTURE_PATH, "utf-8");
}

describe("parseUtpUpcomingEvents", () => {
  it("extracts the earliest Convocation Ceremony row as a Lead candidate", () => {
    const candidates = parseUtpUpcomingEvents(loadFixture());

    expect(candidates).toEqual([
      {
        university: "Universiti Teknologi Petronas",
        date: new Date(2026, 10, 1),
      },
    ]);
  });

  it("ignores rows that aren't the Convocation Ceremony itself", () => {
    const candidates = parseUtpUpcomingEvents(loadFixture());

    expect(candidates).toHaveLength(1);
  });

  it("returns an empty array when the page has no serverTime timestamp to resolve years against", () => {
    const html =
      "<section class='sec-event-listing-row'><section class='sec-event-listing-date'><div class='day'>1</div><div class='month'>Nov</div></section><section class='sec-event-listing-name'>Convocation Ceremony</section></section>";

    expect(parseUtpUpcomingEvents(html)).toEqual([]);
  });

  it("returns an empty array when there's no Convocation Ceremony row", () => {
    const html =
      '<script>var _spPageContextInfo={"serverTime":"2026-07-27T00:19:58.6568395Z"};</script>' +
      "<section class='sec-event-listing-row'><section class='sec-event-listing-date'><div class='day'>1</div><div class='month'>Sep</div></section><section class='sec-event-listing-name'>ESTCON 2026</section></section>";

    expect(parseUtpUpcomingEvents(html)).toEqual([]);
  });
});
