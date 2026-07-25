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
  private readonly optedInPhotographerIdsByEvent = new Map<string, Set<string>>();
  private readonly timeSlots: TimeSlot[] = [];

  constructor(private readonly photographerApproval: PhotographerApprovalCheck) {}

  optIn(photographerId: string, convocationEventId: string): void {
    if (!this.photographerApproval.isApproved(photographerId)) {
      throw new Error(`Photographer ${photographerId} is not approved`);
    }
    const optedIn = this.optedInPhotographerIdsByEvent.get(convocationEventId) ?? new Set();
    optedIn.add(photographerId);
    this.optedInPhotographerIdsByEvent.set(convocationEventId, optedIn);
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
    this.timeSlots.push(slot);
    return slot;
  }

  listOptedInPhotographerIds(convocationEventId: string): string[] {
    return [...(this.optedInPhotographerIdsByEvent.get(convocationEventId) ?? [])];
  }

  listOpenTimeSlots(convocationEventId: string, photographerId: string): TimeSlot[] {
    return this.timeSlots.filter(
      (slot) =>
        slot.convocationEventId === convocationEventId &&
        slot.photographerId === photographerId &&
        slot.status === "open",
    );
  }

  private hasOptedIn(photographerId: string, convocationEventId: string): boolean {
    return this.optedInPhotographerIdsByEvent.get(convocationEventId)?.has(photographerId) ?? false;
  }
}
