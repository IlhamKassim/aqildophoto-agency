import type { PhotographerApprovalCheck } from "./photographer-approval.js";

export interface TimeSlotWindow {
  start: Date;
  end: Date;
}

export interface TimeSlot extends TimeSlotWindow {
  id: string;
  photographerId: string;
  convocationEventId: string;
  status: "open";
}

export class TimeSlotBoard {
  private readonly optIns = new Set<string>();

  constructor(private readonly photographerApproval: PhotographerApprovalCheck) {}

  optIn(photographerId: string, convocationEventId: string): void {
    if (!this.photographerApproval.isApproved(photographerId)) {
      throw new Error(`Photographer ${photographerId} is not approved`);
    }
    this.optIns.add(this.optInKey(photographerId, convocationEventId));
  }

  defineTimeSlot(
    photographerId: string,
    convocationEventId: string,
    window: TimeSlotWindow,
  ): TimeSlot {
    if (!this.optIns.has(this.optInKey(photographerId, convocationEventId))) {
      throw new Error(
        `Photographer ${photographerId} has not opted in to Convocation Event ${convocationEventId}`,
      );
    }
    return {
      id: crypto.randomUUID(),
      photographerId,
      convocationEventId,
      status: "open",
      ...window,
    };
  }

  private optInKey(photographerId: string, convocationEventId: string): string {
    return `${photographerId}::${convocationEventId}`;
  }
}
