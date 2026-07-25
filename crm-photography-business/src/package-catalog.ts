import type { PhotographerApprovalCheck } from "./photographer-approval.js";

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

export interface PackageWithAddOns extends Package {
  addOns: AddOn[];
}

export class PackageCatalog {
  private readonly packages = new Map<string, Package>();
  private readonly addOnsByPackageId = new Map<string, AddOn[]>();
  private readonly addOnsById = new Map<string, AddOn>();

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
    this.addOnsByPackageId.set(pkg.id, []);
    return pkg;
  }

  addAddOn(packageId: string, details: AddOnDetails): AddOn {
    if (!this.packages.has(packageId)) {
      throw new Error(`No Package found with id ${packageId}`);
    }
    const addOn: AddOn = {
      id: crypto.randomUUID(),
      packageId,
      ...details,
    };
    this.addOnsByPackageId.get(packageId)!.push(addOn);
    this.addOnsById.set(addOn.id, addOn);
    return addOn;
  }

  listPackagesWithAddOns(photographerId: string): PackageWithAddOns[] {
    return [...this.packages.values()]
      .filter((pkg) => pkg.photographerId === photographerId)
      .map((pkg) => ({ ...pkg, addOns: this.addOnsByPackageId.get(pkg.id) ?? [] }));
  }

  getTotalPrice(packageId: string, addOnIds: string[]): number {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      throw new Error(`No Package found with id ${packageId}`);
    }
    const addOnsTotal = addOnIds.reduce((sum, addOnId) => {
      const addOn = this.addOnsById.get(addOnId);
      if (!addOn) {
        throw new Error(`No Add-on found with id ${addOnId}`);
      }
      return sum + addOn.price;
    }, 0);
    return pkg.price + addOnsTotal;
  }
}
