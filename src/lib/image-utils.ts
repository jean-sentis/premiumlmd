/**
 * Utilitaires pour l'optimisation des images
 * Note: La transformation Supabase (/render/image/) nécessite le plan Pro.
 * Sur le plan gratuit, on utilise les URLs originales.
 */

// Cache pour savoir si le endpoint render est disponible
let renderAvailable: boolean | null = null;

/**
 * Teste si le endpoint render de Supabase est disponible
 */
async function checkRenderAvailable(baseUrl: string): Promise<boolean> {
  if (renderAvailable !== null) return renderAvailable;
  
  try {
    const testUrl = baseUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const response = await fetch(`${testUrl}?width=10&quality=50`, { method: 'HEAD' });
    renderAvailable = response.ok;
  } catch {
    renderAvailable = false;
  }
  
  return renderAvailable;
}

/**
 * Génère une URL optimisée pour les images Supabase Storage
 * Si le plan Pro est disponible, utilise le endpoint /render/image/
 * Sinon, retourne l'URL originale
 * 
 * @param url - URL de l'image originale
 * @param width - Largeur cible (défaut 800)
 * @param quality - Qualité JPEG 1-100 (défaut 80)
 */
export function getOptimizedImageUrl(url: string, width = 800, quality = 80): string {
  if (!url) return url;

  // Chemins locaux (public/) : forcer une URL absolue.
  // Dans certains contextes (iframes / base href), les chemins absolus "/..." peuvent être résolus de façon inattendue.
  if (url.startsWith("/")) {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }
  
  // Images Supabase Storage : retourner l'URL originale
  // (La transformation nécessite le plan Pro)
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  // Images Interenchères : utiliser le proxy
  if (url.includes('interencheres.com')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}

/**
 * Génère une URL de miniature pour le catalogue
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 400, 75);
}

/**
 * Génère une URL pour l'affichage principal (détail lot)
 */
export function getDisplayUrl(url: string): string {
  return getOptimizedImageUrl(url, 1200, 85);
}

/**
 * Génère une URL haute qualité pour le zoom/fullscreen
 */
export function getFullscreenUrl(url: string): string {
  return getOptimizedImageUrl(url, 1920, 90);
}
