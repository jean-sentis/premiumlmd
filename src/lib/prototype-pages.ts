export const COMPLETE_SPECIALTIES = [
  { id: "art-moderne", title: "Art moderne" },
  { id: "vins-spiritueux", title: "Vins et spiritueux" },
];

export const isIncompleteSpecialty = (id: string) =>
  !COMPLETE_SPECIALTIES.some((specialty) => specialty.id === id);

export const isEmptySale = (actualLotCount: number | null | undefined) => actualLotCount === 0;

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