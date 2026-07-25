import type { ConvocationEvent } from "./convocation-event-registry.js";
import type { PhotographerApprovalCheck } from "./photographer-approval.js";
import type { PackageWithAddOns } from "./package-catalog.js";
import type { TimeSlot } from "./time-slot-board.js";

export interface MarketplaceBrowserDeps {
  convocationEvents: { listUpcomingConvocationEvents(now?: Date): ConvocationEvent[] };
  timeSlotBoard: {
    listOptedInPhotographerIds(convocationEventId: string): string[];
    listOpenTimeSlots(convocationEventId: string, photographerId: string): TimeSlot[];
  };
  packageCatalog: { listPackagesWithAddOns(photographerId: string): PackageWithAddOns[] };
  photographerApproval: PhotographerApprovalCheck;
}

export interface PhotographerListing {
  photographerId: string;
  packages: PackageWithAddOns[];
}

export class MarketplaceBrowser {
  constructor(private readonly deps: MarketplaceBrowserDeps) {}

  browseConvocationEvents(now?: Date): ConvocationEvent[] {
    return this.deps.convocationEvents.listUpcomingConvocationEvents(now);
  }

  browsePhotographersForEvent(convocationEventId: string): PhotographerListing[] {
    return this.deps.timeSlotBoard
      .listOptedInPhotographerIds(convocationEventId)
      .filter((photographerId) => this.deps.photographerApproval.isApproved(photographerId))
      .map((photographerId) => ({
        photographerId,
        packages: this.deps.packageCatalog.listPackagesWithAddOns(photographerId),
      }));
  }

  browseOpenTimeSlots(convocationEventId: string, photographerId: string): TimeSlot[] {
    return this.deps.timeSlotBoard.listOpenTimeSlots(convocationEventId, photographerId);
  }
}
