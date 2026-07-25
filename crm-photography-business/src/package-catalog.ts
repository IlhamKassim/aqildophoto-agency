import type Database from "better-sqlite3";
import type { PhotographerApprovalCheck } from "./photographer-approval";

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

interface PackageRow {
  id: string;
  photographer_id: string;
  name: string;
  price: number;
  description: string;
}

interface AddOnRow {
  id: string;
  package_id: string;
  name: string;
  price: number;
}

function toPackage(row: PackageRow): Package {
  return {
    id: row.id,
    photographerId: row.photographer_id,
    name: row.name,
    price: row.price,
    description: row.description,
  };
}

function toAddOn(row: AddOnRow): AddOn {
  return { id: row.id, packageId: row.package_id, name: row.name, price: row.price };
}

export class PackageCatalog {
  constructor(
    private readonly photographerApproval: PhotographerApprovalCheck,
    private readonly db: Database.Database,
  ) {}

  createPackage(photographerId: string, details: PackageDetails): Package {
    if (!this.photographerApproval.isApproved(photographerId)) {
      throw new Error(`Photographer ${photographerId} is not approved`);
    }
    const pkg: Package = {
      id: crypto.randomUUID(),
      photographerId,
      ...details,
    };
    this.db
      .prepare(
        "INSERT INTO packages (id, photographer_id, name, price, description) VALUES (?, ?, ?, ?, ?)",
      )
      .run(pkg.id, pkg.photographerId, pkg.name, pkg.price, pkg.description);
    return pkg;
  }

  addAddOn(packageId: string, details: AddOnDetails): AddOn {
    if (!this.getPackage(packageId)) {
      throw new Error(`No Package found with id ${packageId}`);
    }
    const addOn: AddOn = {
      id: crypto.randomUUID(),
      packageId,
      ...details,
    };
    this.db
      .prepare("INSERT INTO add_ons (id, package_id, name, price) VALUES (?, ?, ?, ?)")
      .run(addOn.id, addOn.packageId, addOn.name, addOn.price);
    return addOn;
  }

  listPackagesWithAddOns(photographerId: string): PackageWithAddOns[] {
    const rows = this.db
      .prepare(
        "SELECT id, photographer_id, name, price, description FROM packages WHERE photographer_id = ?",
      )
      .all(photographerId) as PackageRow[];
    return rows.map(toPackage).map((pkg) => ({ ...pkg, addOns: this.listAddOns(pkg.id) }));
  }

  getTotalPrice(packageId: string, addOnIds: string[]): number {
    const pkg = this.getPackage(packageId);
    if (!pkg) {
      throw new Error(`No Package found with id ${packageId}`);
    }
    const addOnsTotal = addOnIds.reduce((sum, addOnId) => {
      const addOn = this.getAddOn(addOnId);
      if (!addOn) {
        throw new Error(`No Add-on found with id ${addOnId}`);
      }
      return sum + addOn.price;
    }, 0);
    return pkg.price + addOnsTotal;
  }

  private getPackage(packageId: string): Package | undefined {
    const row = this.db
      .prepare("SELECT id, photographer_id, name, price, description FROM packages WHERE id = ?")
      .get(packageId) as PackageRow | undefined;
    return row ? toPackage(row) : undefined;
  }

  private getAddOn(addOnId: string): AddOn | undefined {
    const row = this.db
      .prepare("SELECT id, package_id, name, price FROM add_ons WHERE id = ?")
      .get(addOnId) as AddOnRow | undefined;
    return row ? toAddOn(row) : undefined;
  }

  private listAddOns(packageId: string): AddOn[] {
    const rows = this.db
      .prepare("SELECT id, package_id, name, price FROM add_ons WHERE package_id = ?")
      .all(packageId) as AddOnRow[];
    return rows.map(toAddOn);
  }
}
