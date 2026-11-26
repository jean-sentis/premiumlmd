export const COMPLETE_SPECIALTIES = [
  { id: "art-moderne", title: "Art moderne" },
  { id: "vins-spiritueux", title: "Vins et spiritueux" },
];

export const isIncompleteSpecialty = (id: string) =>
  !COMPLETE_SPECIALTIES.some((specialty) => specialty.id === id);

export const isEmptySale = (actualLotCount: number | null | undefined) => actualLotCount === 0;