import type Database from "better-sqlite3";

export interface ConvocationEventDetails {
  university: string;
  faculty: string;
  date: Date;
  venue: string;
}

export interface ConvocationEvent extends ConvocationEventDetails {
  id: string;
}

interface ConvocationEventRow {
  id: string;
  university: string;
  faculty: string;
  date: string;
  venue: string;
}

function toConvocationEvent(row: ConvocationEventRow): ConvocationEvent {
  return {
    id: row.id,
    university: row.university,
    faculty: row.faculty,
    date: new Date(row.date),
    venue: row.venue,
  };
}

export class ConvocationEventRegistry {
  constructor(private readonly db: Database.Database) {}

  createConvocationEvent(details: ConvocationEventDetails): ConvocationEvent {
    const event: ConvocationEvent = {
      id: crypto.randomUUID(),
      ...details,
    };
    this.db
      .prepare(
        "INSERT INTO convocation_events (id, university, faculty, date, venue) VALUES (?, ?, ?, ?, ?)",
      )
      .run(event.id, event.university, event.faculty, event.date.toISOString(), event.venue);
    return event;
  }

  listUpcomingConvocationEvents(now: Date = new Date()): ConvocationEvent[] {
    const rows = this.db
      .prepare("SELECT id, university, faculty, date, venue FROM convocation_events")
      .all() as ConvocationEventRow[];
    return rows.map(toConvocationEvent).filter((event) => event.date >= now);
  }

  getConvocationEventDate(convocationEventId: string): Date {
    const row = this.db
      .prepare("SELECT date FROM convocation_events WHERE id = ?")
      .get(convocationEventId) as { date: string } | undefined;
    if (!row) {
      throw new Error(`No Convocation Event found with id ${convocationEventId}`);
    }
    return new Date(row.date);
  }
}
