import { describe, expect, test } from "bun:test";
import { matchesUpcomingSaleSpecialty } from "../src/lib/upcoming-sale-specialties";

describe("Catégories des ventes en préparation", () => {
  test("Les céramiques sont classées dans Art du XXe siècle, pas dans Mobilier", () => {
    const sale = { title: "Céramiques & Verreries", specialty: "Art XXe" };
    expect(matchesUpcomingSaleSpecialty(sale, "art-moderne")).toBe(true);
    expect(matchesUpcomingSaleSpecialty(sale, "mobilier")).toBe(false);
  });
});