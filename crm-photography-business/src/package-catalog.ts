export interface PhotographerApprovalCheck {
  isApproved(photographerId: string): boolean;
}

export interface PackageDetails {
  name: string;
  price: number;
  description: string;
}

export interface Package extends PackageDetails {
  id: string;
  photographerId: string;
}

export interface AddOnDetails {
  name: string;
  price: number;
}

export interface AddOn extends AddOnDetails {
  id: string;
  packageId: string;
}

export class PackageCatalog {
  private readonly packages = new Map<string, Package>();

  constructor(private readonly photographerApproval: PhotographerApprovalCheck) {}

  createPackage(photographerId: string, details: PackageDetails): Package {
    if (!this.photographerApproval.isApproved(photographerId)) {
      throw new Error(`Photographer ${photographerId} is not approved`);
    }
    const pkg: Package = {
      id: crypto.randomUUID(),
      photographerId,
      ...details,
    };
    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  addAddOn(packageId: string, details: AddOnDetails): AddOn {
    if (!this.packages.has(packageId)) {
      throw new Error(`No Package found with id ${packageId}`);
    }
    return {
      id: crypto.randomUUID(),
      packageId,
      ...details,
    };
  }
}
