import { describe, expect, test } from "bun:test";
import { COMPLETE_SPECIALTIES, isIncompleteSpecialty, isEmptySale } from "../src/lib/prototype-pages";

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
  test("Une vente sans lots est signalée", () => {
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
});