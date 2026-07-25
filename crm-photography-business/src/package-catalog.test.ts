import { describe, expect, it } from "vitest";
import { PackageCatalog } from "./package-catalog.js";

function approvalOf(approvedIds: string[]) {
  return { isApproved: (photographerId: string) => approvedIds.includes(photographerId) };
}

describe("PackageCatalog", () => {
  it("lets an approved Photographer create a Package", () => {
    const catalog = new PackageCatalog(approvalOf(["photographer-1"]));

    const pkg = catalog.createPackage("photographer-1", {
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });

    expect(pkg).toMatchObject({
      photographerId: "photographer-1",
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });
  });

  it("refuses to create a Package for a Photographer who is not approved", () => {
    const catalog = new PackageCatalog(approvalOf([]));

    expect(() =>
      catalog.createPackage("photographer-1", {
        name: "Basic",
        price: 300,
        description: "2hrs, 30 edited photos",
      }),
    ).toThrow();
  });

  it("lets a Photographer add an Add-on to an existing Package", () => {
    const catalog = new PackageCatalog(approvalOf(["photographer-1"]));
    const pkg = catalog.createPackage("photographer-1", {
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });

    const addOn = catalog.addAddOn(pkg.id, { name: "Extra hour", price: 100 });

    expect(addOn).toMatchObject({
      packageId: pkg.id,
      name: "Extra hour",
      price: 100,
    });
  });

  it("refuses to add an Add-on to a non-existent Package", () => {
    const catalog = new PackageCatalog(approvalOf(["photographer-1"]));

    expect(() =>
      catalog.addAddOn("unknown-package-id", { name: "Extra hour", price: 100 }),
    ).toThrow();
  });

  it("lists a Photographer's Packages together with their Add-ons", () => {
    const catalog = new PackageCatalog(approvalOf(["photographer-1"]));
    const pkg = catalog.createPackage("photographer-1", {
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });
    catalog.addAddOn(pkg.id, { name: "Extra hour", price: 100 });

    const packages = catalog.listPackagesWithAddOns("photographer-1");

    expect(packages).toEqual([
      {
        ...pkg,
        addOns: [expect.objectContaining({ name: "Extra hour", price: 100 })],
      },
    ]);
  });

  it("computes the total price of a Package plus selected Add-ons", () => {
    const catalog = new PackageCatalog(approvalOf(["photographer-1"]));
    const pkg = catalog.createPackage("photographer-1", {
      name: "Basic",
      price: 300,
      description: "2hrs, 30 edited photos",
    });
    const addOn = catalog.addAddOn(pkg.id, { name: "Extra hour", price: 100 });

    const total = catalog.getTotalPrice(pkg.id, [addOn.id]);

    expect(total).toBe(400);
  });
});
