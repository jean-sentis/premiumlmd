import { describe, expect, test } from "bun:test";
import { WITHDRAWN_PAST_SALE_IDS, isPublicSale, publicSales, DEMO_PHONE, ACCOUNT_SIGNUP_PATH } from "../src/lib/demo-publication";
import { accountRegistrationSchema } from "../src/lib/account-registration";

describe("Publication de démonstration", () => {
  test("Retire exactement les sept dernières ventes de la liste chronologique décroissante", () => {
    expect(WITHDRAWN_PAST_SALE_IDS).toHaveLength(7);
    expect(publicSales([...WITHDRAWN_PAST_SALE_IDS.map((id) => ({ id })), { id: "vente-conservee" }])).toEqual([{ id: "vente-conservee" }]);
    expect(isPublicSale("a1b2c3d4-0007-4000-8000-000000000007")).toBe(false);
    expect(isPublicSale("a1b2c3d4-0008-4000-8000-000000000008")).toBe(true);
  });
  test("La vente judiciaire vide est retirée", () => expect(isPublicSale("judiciaire-demo-001")).toBe(false));
  test("Le numéro de démonstration est manifestement fictif", () => expect(DEMO_PHONE).toBe("00 00 00 00 00"));
  test("L’inscription est proposée sur la page compte", () => expect(ACCOUNT_SIGNUP_PATH).toBe("/compte"));
});

describe("Inscription", () => {
  const valid = { firstName: "Camille", lastName: "Martin", email: "camille@example.com", password: "Exemple42!", confirmPassword: "Exemple42!", terms: true };
  test("Accepte les informations complètes et les conditions acceptées", () => expect(accountRegistrationSchema.safeParse(valid).success).toBe(true));
  test("Refuse des mots de passe différents", () => expect(accountRegistrationSchema.safeParse({ ...valid, confirmPassword: "Different42!" }).success).toBe(false));
  test("Refuse l’inscription sans acceptation des conditions", () => expect(accountRegistrationSchema.safeParse({ ...valid, terms: false }).success).toBe(false));
});