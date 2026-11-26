export const COMPLETE_SPECIALTIES = [
  { id: "art-moderne", title: "Art moderne" },
  { id: "vins-spiritueux", title: "Vins et spiritueux" },
];

export const isIncompleteSpecialty = (id: string) =>
  !COMPLETE_SPECIALTIES.some((specialty) => specialty.id === id);

export const isEmptySale = (actualLotCount: number | null | undefined) => actualLotCount === 0;

// A sale whose auction has not happened yet legitimately has no catalogue yet:
// it must stay reachable even when no populated lot exists.
export const isInPreparationSale = (saleDate: string | null | undefined, now: Date): boolean => {
  if (!saleDate) return true;
  const date = new Date(saleDate);
  return Number.isNaN(date.getTime()) || date.getTime() >= now.getTime();
};

export const isSaleWithoutContent = (
  actualLotCount: number | null | undefined,
  inPreparation: boolean,
) => !inPreparation && isEmptySale(actualLotCount);

export interface LotContent {
  description: string | null;
  images: unknown;
}

export const hasLotDescription = (description: string | null) =>
  /\p{L}/u.test((description ?? "").replace(/<[^>]*>/g, " ").replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, " "));

export async function isPopulatedLot(lot: LotContent, canDisplay: (url: string) => Promise<boolean>) {
  if (!hasLotDescription(lot.description) || !Array.isArray(lot.images)) return false;
  for (const image of lot.images) {
    if (typeof image === "string" && image.trim() && await canDisplay(image)) return true;
  }
  return false;
}

export async function filterPopulatedLots<T extends LotContent>(lots: T[], canDisplay: (url: string) => Promise<boolean>): Promise<T[]> {
  const populated = await Promise.all(lots.map((lot) => isPopulatedLot(lot, canDisplay)));
  return lots.filter((_, index) => populated[index]);
}

export const saleIdFromPath = (path: string): string | undefined =>
  path.match(/^\/vente\/([^/?#]+)(?:[?#].*)?$/)?.[1];