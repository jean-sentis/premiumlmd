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

export const isPublicSale = (id: string) =>
  id !== "judiciaire-demo-001" && !WITHDRAWN_PAST_SALE_IDS.some((withdrawn) => withdrawn === id);

export const publicSales = <T extends { id: string }>(sales: T[]) => sales.filter((sale) => isPublicSale(sale.id));

export const DEMO_PHONE = "00 00 00 00 00";
export const ACCOUNT_SIGNUP_PATH = "/compte";