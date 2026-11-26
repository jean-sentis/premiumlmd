import { getThumbnailUrl } from "@/lib/image-utils";
import { pickBestInterencheresImages } from "@/lib/interencheres-images";
import { filterPopulatedLots, type LotContent } from "@/lib/prototype-pages";

// Share checks across navigation, catalogue counts and catalogue cards.
const checks = new Map<string, { expires: number; result: Promise<boolean> }>();
const waiting: Array<() => void> = [];
let active = 0;

async function canDisplayPhoto(raw: string): Promise<boolean> {
  const url = getThumbnailUrl(raw);
  const cached = checks.get(url);
  if (cached && cached.expires > Date.now()) return cached.result;
  const result = (async () => {
    await new Promise<void>((resolve) => {
      const start = () => { active += 1; resolve(); };
      if (active < 8) start(); else waiting.push(start);
    });
    try {
      return await new Promise<boolean>((resolve) => {
        const image = new Image();
        const finish = (ok: boolean) => {
          clearTimeout(timer);
          image.onload = null;
          image.onerror = null;
          resolve(ok);
        };
        const timer = window.setTimeout(() => { finish(false); image.src = ""; }, 8000);
        image.onload = () => finish(image.naturalWidth > 0 && image.naturalHeight > 0);
        image.onerror = () => finish(false);
        image.src = url;
      });
    } finally {
      active -= 1;
      waiting.shift()?.();
    }
  })();
  checks.set(url, { expires: Date.now() + 30_000, result });
  return result;
}

export async function getPopulatedLots<T extends LotContent>(lots: T[]): Promise<T[]> {
  const normalized = lots.map((lot) => ({
    ...lot,
    images: pickBestInterencheresImages(
      Array.isArray(lot.images) ? lot.images.filter((image): image is string => typeof image === "string") : [],
    ),
  }));
  const populated = await filterPopulatedLots(normalized, canDisplayPhoto);
  return Promise.all(populated.map(async (lot) => {
    for (const image of lot.images) {
      if (await canDisplayPhoto(image)) {
        return { ...lot, images: [image, ...lot.images.filter((other) => other !== image)] };
      }
    }
    return lot;
  }));
}