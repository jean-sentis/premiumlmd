// Normalisation et sélection d’URLs d’images Interenchères.
// Objectif: éviter les URLs invalides (ex: thumbor `=/fit-in/2025/...` sans taille) et privilégier les variantes `smart`.

function normalizeUrl(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return s;

  // Fix protocol-relative
  let url = s.startsWith("//") ? `https:${s}` : s;

  // Fix accidental double slashes after hostname
  url = url.replace(/^(https?:\/\/[^/]+)\/\//, "$1/");

  return url;
}

function isThumborMissingSizeFitIn(url: string): boolean {
  // Pattern observé en base: ...= /fit-in/2025/... (il manque WxH). Ces URLs échouent et on ne peut pas les corriger (signature).
  return /thumbor-.*\.interencheres\.com\/[^=]+=\/fit-in\/20\d{2}\//i.test(url);
}

function scoreUrl(url: string): number {
  // Score élevé = plus probable de fonctionner
  const u = url.toLowerCase();
  if (u.includes("=/smart/")) return 300;
  if (u.includes("/smart/")) return 200;
  if (u.includes("=/160x120/smart/")) return 190;
  if (u.includes("=/")) return 120; // signé mais pas smart
  return 50;
}

export function normalizeInterencheresImageUrl(input: string): string {
  return normalizeUrl(input);
}

export function pickBestInterencheresImages(inputs: string[], max = 12): string[] {
  const cleaned = (Array.isArray(inputs) ? inputs : [])
    .map(normalizeUrl)
    .filter(Boolean)
    .filter((u) => !isThumborMissingSizeFitIn(u));

  cleaned.sort((a, b) => scoreUrl(b) - scoreUrl(a));

  // Dédupe tout en gardant l'ordre
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of cleaned) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= max) break;
  }

  return out;
}
