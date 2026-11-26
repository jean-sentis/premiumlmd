// Explicit withdrawals: never infer removals from a moving date or mutate client history.
export const WITHDRAWN_PAST_SALE_IDS = [
  "a1b2c3d4-0001-4000-8000-000000000001",
  "a1b2c3d4-0002-4000-8000-000000000002",
  "a1b2c3d4-0003-4000-8000-000000000003",
  "a1b2c3d4-0004-4000-8000-000000000004",
  "a1b2c3d4-0005-4000-8000-000000000005",
  "a1b2c3d4-0006-4000-8000-000000000006",
  "a1b2c3d4-0007-4000-8000-000000000007",
] as const;

// Last twenty entries of the preparation list, from 18 April to 19 December 2026.
export const WITHDRAWN_PREPARATION_SALE_IDS = [
  "a6df35cb-9c20-4f93-b40e-6454691de7e7",
  "a5830927-0643-4274-9435-4c674b06ee31",
  "ade285d4-1568-4d64-ae15-d1dcd9e5e7c2",
  "d3cacee2-5abd-43b8-8df7-9ab354a973ee",
  "cad62152-ed35-4f67-9e74-05ec386cf873",
  "ca754538-4a6e-4814-a1fa-cdf63397ad5f",
  "61069996-9e41-4b31-ba13-295bd440ef13",
  "93b64d3c-ba5d-4754-a835-96b93d5042ee",
  "cb01d556-4538-480b-91ec-fd3618460535",
  "08720fcd-4d8a-4c71-914a-ac6b43aa1c25",
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
] as const;

export const isPublicSale = (id: string) =>
  id !== "judiciaire-demo-001" &&
  !WITHDRAWN_PAST_SALE_IDS.some((withdrawn) => withdrawn === id) &&
  !WITHDRAWN_PREPARATION_SALE_IDS.some((withdrawn) => withdrawn === id);

export const publicSales = <T extends { id: string }>(sales: T[]) => sales.filter((sale) => isPublicSale(sale.id));

export const DEMO_PHONE = "00 00 00 00 00";
export const ACCOUNT_SIGNUP_PATH = "/compte";