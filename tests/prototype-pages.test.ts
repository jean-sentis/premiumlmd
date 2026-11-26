import { describe, expect, test } from "bun:test";
import { COMPLETE_SPECIALTIES, isIncompleteSpecialty, isEmptySale, isInPreparationSale, isSaleWithoutContent, saleIdFromPath, filterPopulatedLots, isPopulatedLot } from "../src/lib/prototype-pages";

describe("Lots réellement renseignés", () => {
  const visible = async (url: string) => url === "/photo.jpg";
  test("Un numéro seul ou une photo sans descriptif ne compte pas", async () => {
    for (const description of [null, "", "   ", "<p>&nbsp;</p>", "123"]) {
      expect(await isPopulatedLot({ description, images: ["/photo.jpg"] }, visible)).toBe(false);
    }
  });
  test("Un descriptif sans photo affichable ne compte pas", async () => {
    for (const images of [null, [], [""], ["/photo-cassee.jpg"]]) {
      expect(await isPopulatedLot({ description: "Vase en porcelaine.", images }, visible)).toBe(false);
    }
  });
  test("Une photo affichable et un descriptif sont tous deux nécessaires", async () => {
    expect(await isPopulatedLot({ description: "Vase en porcelaine.", images: ["/photo.jpg"] }, visible)).toBe(true);
  });
  test("Une photo de secours affichable suffit si le descriptif est renseigné", async () => {
    expect(await isPopulatedLot({ description: "Vase en porcelaine.", images: ["/photo-cassee.jpg", "/photo.jpg"] }, visible)).toBe(true);
  });
  test("Cinq emplacements dont un seul renseigné comptent pour un lot et non cinq", async () => {
    const lots = [
      { id: 1, description: "Vase en porcelaine.", images: ["/photo.jpg"] },
      { id: 2, description: null, images: ["/photo.jpg"] },
      { id: 3, description: "Commode en noyer.", images: [] },
      { id: 4, description: "Montre en acier.", images: ["/photo-cassee.jpg"] },
      { id: 5, description: "", images: [] },
    ];
    expect((await filterPopulatedLots(lots, visible)).map((lot) => lot.id)).toEqual([1]);
  });
});

describe("Pages incomplètes", () => {
  test("Seuls Art moderne et Vins et spiritueux sont accessibles dans le menu", () => {
    expect(COMPLETE_SPECIALTIES.map((item) => item.id)).toEqual(["art-moderne", "vins-spiritueux"]);
    expect(isIncompleteSpecialty("art-moderne")).toBe(false);
    expect(isIncompleteSpecialty("vins-spiritueux")).toBe(false);
  });
  test("Les neuf autres spécialités restent inactives dans le menu", () => {
    for (const id of ["argenterie", "art-xxeme", "bijoux-montres", "collections", "mobilier-objets-art", "mode-textile", "voitures-collection", "ceramiques", "militaria"]) {
      expect(isIncompleteSpecialty(id)).toBe(true);
    }
  });
  test("Une vente sans lots doit être grisée et inactive", () => {
    expect(isEmptySale(0)).toBe(true);
  });
  test("Une vente avec des lots n'est pas signalée comme vide", () => {
    expect(isEmptySale(1)).toBe(false);
    expect(isEmptySale(30)).toBe(false);
  });
  test("Un comptage inconnu ou en erreur ne signifie pas une vente vide", () => {
    expect(isEmptySale(null)).toBe(false);
    expect(isEmptySale(undefined)).toBe(false);
  });
  test("Seuls les liens de ventes sont soumis au comptage, pas les lots ou les autres pages", () => {
    expect(saleIdFromPath("/vente/vente-exemple")).toBe("vente-exemple");
    expect(saleIdFromPath("/vente/vente-exemple#catalogue")).toBe("vente-exemple");
    expect(saleIdFromPath("/vente/vente-exemple/lot/lot-exemple")).toBeUndefined();
    expect(saleIdFromPath("/acheter/ventes-a-venir")).toBeUndefined();
  });
});

describe("Ventes en préparation", () => {
  const now = new Date("2026-01-03T00:00:00Z");
  test("Une vente à venir est en préparation, même sans date", () => {
    expect(isInPreparationSale("2026-01-10T13:00:00+00:00", now)).toBe(true);
    expect(isInPreparationSale(null, now)).toBe(true);
    expect(isInPreparationSale("date invalide", now)).toBe(true);
  });
  test("Une vente déjà tenue n'est plus en préparation", () => {
    expect(isInPreparationSale("2025-12-20T13:00:00+00:00", now)).toBe(false);
  });
  test("Une vente en préparation reste active sans aucun lot", () => {
    expect(isSaleWithoutContent(0, true)).toBe(false);
    expect(isSaleWithoutContent(0, false)).toBe(true);
  });
  test("Une vente avec des lots reste active, en préparation ou non", () => {
    expect(isSaleWithoutContent(12, false)).toBe(false);
    expect(isSaleWithoutContent(12, true)).toBe(false);
  });
  test("Un comptage inconnu ne grise jamais une vente", () => {
    expect(isSaleWithoutContent(undefined, false)).toBe(false);
    expect(isSaleWithoutContent(null, true)).toBe(false);
  });
});