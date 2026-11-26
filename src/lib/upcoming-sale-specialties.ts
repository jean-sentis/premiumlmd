// Upcoming-sale categories, independently testable from the page.
export const UPCOMING_SPECIALTY_KEYWORDS: Record<string, string[]> = {
  "bijoux-montres": ["bijoux", "montre", "joaillerie", "horlogerie", "or", "diamant", "bague", "collier", "bracelet"],
  "art-moderne": ["art moderne", "art contemporain", "contemporain", "xxe", "xxème", "tableau", "peinture", "sculpture", "1900", "estampe", "lithographie", "grands maîtres", "oeuvre", "céramique", "ceramique"],
  "mobilier": ["mobilier", "meuble", "objet", "design", "intérieur", "caractère"],
  "vins": ["vin", "spiritueux", "champagne", "cru", "bordeaux", "bourgogne", "millésime"],
  "argenterie": ["argent", "argenterie", "orfèvrerie", "vermeil"],
  "voitures": ["véhicule", "voiture", "automobile", "auto", "moto"],
  "mode": ["mode", "textile", "vintage", "couture", "hermès", "vuitton", "luxe", "maroquinerie", "accessoire"],
  "collections": ["collection", "curiosité", "militaria", "arme", "livre", "manuscrit", "numismatique", "philatélie", "tribal", "instrument"],
};

export function matchesUpcomingSaleSpecialty(sale: { title: string; specialty: string | null }, selected: string): boolean {
  if (selected === "all") return true;
  const combined = `${sale.specialty || ""} ${sale.title}`.toLowerCase();
  return (UPCOMING_SPECIALTY_KEYWORDS[selected] || []).some(keyword => combined.includes(keyword));
}