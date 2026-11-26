import { describe, expect, test } from "bun:test";
import { WITHDRAWN_PAST_SALE_IDS, WITHDRAWN_PREPARATION_SALE_IDS, isPublicSale, publicSales, DEMO_PHONE, ACCOUNT_SIGNUP_PATH } from "../src/lib/demo-publication";
import { accountRegistrationSchema } from "../src/lib/account-registration";

describe("Publication de démonstration", () => {
  test("Retire exactement les sept dernières ventes de la liste chronologique décroissante", () => {
    expect(WITHDRAWN_PAST_SALE_IDS).toHaveLength(7);
    expect(publicSales([...WITHDRAWN_PAST_SALE_IDS.map((id) => ({ id })), { id: "vente-conservee" }])).toEqual([{ id: "vente-conservee" }]);
    expect(isPublicSale("a1b2c3d4-0007-4000-8000-000000000007")).toBe(false);
    expect(isPublicSale("a1b2c3d4-0008-4000-8000-000000000008")).toBe(true);
  });
  test("La vente judiciaire vide est retirée", () => expect(isPublicSale("judiciaire-demo-001")).toBe(false));
  test("Retire les dix dernières ventes en préparation et conserve celle du 19 septembre", () => {
    const withdrawn = [
      "c299c441-aff7-435d-ad92-15ce9fde53fb",
      "84e37adf-6ffc-4f5a-905f-a00db4b718ee",
      "b4671363-6c14-4a56-b353-9765d3687987",
      "c26ec5c9-24b6-4b7c-87f6-7746be387c3c",
      "7a02b51c-b8d7-4329-ad46-8605ed03a1d7",
      "a832443d-c94c-4837-8333-f73e3c350ea6",
      "6280b7cb-0afc-4644-aeb1-7dddd7d43641",
      "ec201458-86f4-4a9a-a5a9-c545b54005bf",
      "89d0fce6-7db8-47d5-8989-1d2143387663",
      "888c067e-7e58-4326-a909-65ba05f89a66",
    ];
    expect(WITHDRAWN_PREPARATION_SALE_IDS).toEqual(withdrawn);
    const retained = { id: "08720fcd-4d8a-4c71-914a-ac6b43aa1c25" };
    expect(publicSales([...withdrawn.map((id) => ({ id })), retained])).toEqual([retained]);
  });
  test("Le numéro de démonstration est manifestement fictif", () => expect(DEMO_PHONE).toBe("00 00 00 00 00"));
  test("L’inscription est proposée sur la page compte", () => expect(ACCOUNT_SIGNUP_PATH).toBe("/compte"));
});

describe("Inscription", () => {
  const valid = { firstName: "Camille", lastName: "Martin", email: "camille@example.com", password: "Exemple42!", confirmPassword: "Exemple42!", terms: true };
  test("Accepte les informations complètes et les conditions acceptées", () => expect(accountRegistrationSchema.safeParse(valid).success).toBe(true));
  test("Refuse des mots de passe différents", () => expect(accountRegistrationSchema.safeParse({ ...valid, confirmPassword: "Different42!" }).success).toBe(false));
  test("Refuse l’inscription sans acceptation des conditions", () => expect(accountRegistrationSchema.safeParse({ ...valid, terms: false }).success).toBe(false));
});