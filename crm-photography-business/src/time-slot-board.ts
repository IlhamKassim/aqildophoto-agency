import type Database from "better-sqlite3";
import type { PhotographerApprovalCheck } from "./photographer-approval";

export interface TimeSlotWindow {
  start: Date;
  end: Date;
}

export interface TimeSlot extends TimeSlotWindow {
  id: string;
  photographerId: string;
  convocationEventId: string;
  status: "open" | "held";
}

interface TimeSlotRow {
  id: string;
  photographer_id: string;
  convocation_event_id: string;
  start: string;
  end: string;
  status: "open" | "held";
}

function toTimeSlot(row: TimeSlotRow): TimeSlot {
  return {
    id: row.id,
    photographerId: row.photographer_id,
    convocationEventId: row.convocation_event_id,
    start: new Date(row.start),
    end: new Date(row.end),
    status: row.status,
  };
}

export class TimeSlotBoard {
  constructor(
    private readonly photographerApproval: PhotographerApprovalCheck,
    private readonly db: Database.Database,
  ) {}

  optIn(photographerId: string, convocationEventId: string): void {
    if (!this.photographerApproval.isApproved(photographerId)) {
      throw new Error(`Photographer ${photographerId} is not approved`);
    }
    this.db
      .prepare(
        "INSERT OR IGNORE INTO time_slot_opt_ins (photographer_id, convocation_event_id) VALUES (?, ?)",
      )
      .run(photographerId, convocationEventId);
  }

  defineTimeSlot(
    photographerId: string,
    convocationEventId: string,
    window: TimeSlotWindow,
  ): TimeSlot {
    if (!this.hasOptedIn(photographerId, convocationEventId)) {
      throw new Error(
        `Photographer ${photographerId} has not opted in to Convocation Event ${convocationEventId}`,
      );
    }
    const slot: TimeSlot = {
      id: crypto.randomUUID(),
      photographerId,
      convocationEventId,
      status: "open",
      ...window,
    };
    this.db
      .prepare(
        "INSERT INTO time_slots (id, photographer_id, convocation_event_id, start, end, status) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        slot.id,
        slot.photographerId,
        slot.convocationEventId,
        slot.start.toISOString(),
        slot.end.toISOString(),
        slot.status,
      );
    return slot;
  }

  listOptedInPhotographerIds(convocationEventId: string): string[] {
    const rows = this.db
      .prepare(
        "SELECT photographer_id FROM time_slot_opt_ins WHERE convocation_event_id = ?",
      )
      .all(convocationEventId) as { photographer_id: string }[];
    return rows.map((row) => row.photographer_id);
  }

  listOpenTimeSlots(convocationEventId: string, photographerId: string): TimeSlot[] {
    const rows = this.db
      .prepare(
        "SELECT id, photographer_id, convocation_event_id, start, end, status FROM time_slots WHERE convocation_event_id = ? AND photographer_id = ? AND status = 'open'",
      )
      .all(convocationEventId, photographerId) as TimeSlotRow[];
    return rows.map(toTimeSlot);
  }

  lockTimeSlot(timeSlotId: string): void {
    const slot = this.getSlotOrThrow(timeSlotId);
    if (slot.status !== "open") {
      throw new Error(`Time Slot ${timeSlotId} is not open`);
    }
    this.db.prepare("UPDATE time_slots SET status = 'held' WHERE id = ?").run(timeSlotId);
  }

  reopenTimeSlot(timeSlotId: string): void {
    this.getSlotOrThrow(timeSlotId);
    this.db.prepare("UPDATE time_slots SET status = 'open' WHERE id = ?").run(timeSlotId);
  }

  private getSlotOrThrow(timeSlotId: string): TimeSlot {
    const row = this.db
      .prepare(
        "SELECT id, photographer_id, convocation_event_id, start, end, status FROM time_slots WHERE id = ?",
      )
      .get(timeSlotId) as TimeSlotRow | undefined;
    if (!row) {
      throw new Error(`No Time Slot found with id ${timeSlotId}`);
    }
    return toTimeSlot(row);
  }

  private hasOptedIn(photographerId: string, convocationEventId: string): boolean {
    const row = this.db
      .prepare(
        "SELECT 1 FROM time_slot_opt_ins WHERE photographer_id = ? AND convocation_event_id = ?",
      )
      .get(photographerId, convocationEventId);
    return row !== undefined;
  }
}
