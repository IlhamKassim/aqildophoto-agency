import type Database from "better-sqlite3";

export type PhotographerStatus = "pending" | "approved" | "rejected";

export interface PhotographerProfile {
  name: string;
}

export interface Photographer extends PhotographerProfile {
  id: string;
  status: PhotographerStatus;
}

interface PhotographerRow {
  id: string;
  name: string;
  status: PhotographerStatus;
}

function toPhotographer(row: PhotographerRow): Photographer {
  return { id: row.id, name: row.name, status: row.status };
}

export class PhotographerRegistry {
  constructor(private readonly db: Database.Database) {}

  registerPhotographer(profile: PhotographerProfile): Photographer {
    const photographer: Photographer = {
      id: crypto.randomUUID(),
      ...profile,
      status: "pending",
    };
    this.db
      .prepare("INSERT INTO photographers (id, name, status) VALUES (?, ?, ?)")
      .run(photographer.id, photographer.name, photographer.status);
    return photographer;
  }

  approvePhotographer(photographerId: string): Photographer {
    const photographer = this.getPendingOrThrow(photographerId);
    this.updateStatus(photographerId, "approved");
    return { ...photographer, status: "approved" };
  }

  rejectPhotographer(photographerId: string): Photographer {
    const photographer = this.getPendingOrThrow(photographerId);
    this.updateStatus(photographerId, "rejected");
    return { ...photographer, status: "rejected" };
  }

  isApproved(photographerId: string): boolean {
    return this.get(photographerId)?.status === "approved";
  }

  listAllPhotographers(): Photographer[] {
    const rows = this.db
      .prepare("SELECT id, name, status FROM photographers")
      .all() as PhotographerRow[];
    return rows.map(toPhotographer);
  }

  private get(photographerId: string): Photographer | undefined {
    const row = this.db
      .prepare("SELECT id, name, status FROM photographers WHERE id = ?")
      .get(photographerId) as PhotographerRow | undefined;
    return row ? toPhotographer(row) : undefined;
  }

  private updateStatus(photographerId: string, status: PhotographerStatus): void {
    this.db
      .prepare("UPDATE photographers SET status = ? WHERE id = ?")
      .run(status, photographerId);
  }

  private getPendingOrThrow(photographerId: string): Photographer {
    const photographer = this.get(photographerId);
    if (!photographer) {
      throw new Error(`No Photographer found with id ${photographerId}`);
    }
    if (photographer.status !== "pending") {
      throw new Error(
        `Photographer ${photographerId} is ${photographer.status}, not pending`,
      );
    }
    return photographer;
  }
}
