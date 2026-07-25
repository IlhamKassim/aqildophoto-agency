import { describe, expect, it } from "vitest";
import { openDatabase, initializeSchema } from "./database.js";

const EXPECTED_TABLES = [
  "photographers",
  "convocation_events",
  "packages",
  "add_ons",
  "time_slot_opt_ins",
  "time_slots",
  "bookings",
];

function listTables(db: ReturnType<typeof openDatabase>): string[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row: any) => row.name);
}

describe("openDatabase", () => {
  it("creates all expected tables", () => {
    const db = openDatabase(":memory:");

    const tables = listTables(db);

    for (const table of EXPECTED_TABLES) {
      expect(tables).toContain(table);
    }
  });

  it("initializeSchema is idempotent when called again on the same connection", () => {
    const db = openDatabase(":memory:");

    expect(() => initializeSchema(db)).not.toThrow();
    expect(listTables(db)).toEqual(expect.arrayContaining(EXPECTED_TABLES));
  });
});
