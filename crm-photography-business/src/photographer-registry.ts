export type PhotographerStatus = "pending" | "approved" | "rejected";

export interface PhotographerProfile {
  name: string;
}

export interface Photographer extends PhotographerProfile {
  id: string;
  status: PhotographerStatus;
}

export class PhotographerRegistry {
  private readonly photographers = new Map<string, Photographer>();

  registerPhotographer(profile: PhotographerProfile): Photographer {
    const photographer: Photographer = {
      id: crypto.randomUUID(),
      ...profile,
      status: "pending",
    };
    this.photographers.set(photographer.id, photographer);
    return photographer;
  }

  approvePhotographer(photographerId: string): Photographer {
    const photographer = this.getPendingOrThrow(photographerId);
    photographer.status = "approved";
    return photographer;
  }

  rejectPhotographer(photographerId: string): Photographer {
    const photographer = this.getPendingOrThrow(photographerId);
    photographer.status = "rejected";
    return photographer;
  }

  isApproved(photographerId: string): boolean {
    return this.photographers.get(photographerId)?.status === "approved";
  }

  private getPendingOrThrow(photographerId: string): Photographer {
    const photographer = this.photographers.get(photographerId);
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
