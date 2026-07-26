import type Database from "better-sqlite3";

export interface ConvocationLeadDetails {
  university: string;
  date: Date;
  venue?: string;
}

export interface ConvocationLead extends ConvocationLeadDetails {
  id: string;
  dismissed: boolean;
}

interface ConvocationLeadRow {
  id: string;
  university: string;
  date: string;
  venue: string | null;
  dismissed: number;
}

function toConvocationLead(row: ConvocationLeadRow): ConvocationLead {
  return {
    id: row.id,
    university: row.university,
    date: new Date(row.date),
    venue: row.venue ?? undefined,
    dismissed: row.dismissed === 1,
  };
}

/** The "next 6 months" window operators see Leads within, per the PRD. */
function sixMonthsFrom(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 6);
  return result;
}

export class ConvocationLeadRegistry {
  constructor(private readonly db: Database.Database) {}

  /**
   * Same (university, date) is the same Lead — repeated scrapes of an
   * already-announced ceremony must not create duplicate rows, and must not
   * un-dismiss a Lead the operator already dismissed.
   */
  addLead(details: ConvocationLeadDetails): ConvocationLead {
    const existing = this.findByUniversityAndDate(details.university, details.date);
    if (existing) {
      return existing;
    }
    const lead: ConvocationLead = {
      id: crypto.randomUUID(),
      dismissed: false,
      ...details,
    };
    this.db
      .prepare(
        "INSERT INTO convocation_leads (id, university, date, venue, dismissed) VALUES (?, ?, ?, ?, 0)",
      )
      .run(lead.id, lead.university, lead.date.toISOString(), lead.venue ?? null);
    return lead;
  }

  private findByUniversityAndDate(university: string, date: Date): ConvocationLead | undefined {
    const row = this.db
      .prepare(
        "SELECT id, university, date, venue, dismissed FROM convocation_leads WHERE university = ? AND date = ?",
      )
      .get(university, date.toISOString()) as ConvocationLeadRow | undefined;
    return row ? toConvocationLead(row) : undefined;
  }

  listUpcomingLeads(now: Date = new Date()): ConvocationLead[] {
    const horizon = sixMonthsFrom(now);
    const rows = this.db
      .prepare("SELECT id, university, date, venue, dismissed FROM convocation_leads")
      .all() as ConvocationLeadRow[];
    return rows
      .map(toConvocationLead)
      .filter((lead) => !lead.dismissed && lead.date >= now && lead.date <= horizon)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  dismissLead(id: string): void {
    const result = this.db
      .prepare("UPDATE convocation_leads SET dismissed = 1 WHERE id = ?")
      .run(id);
    if (result.changes === 0) {
      throw new Error(`No Convocation Lead found with id ${id}`);
    }
  }
}
