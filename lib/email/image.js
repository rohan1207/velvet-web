/**
 * Email clients (esp. Gmail) often fail on SVG / AVIF.
 * Prefer PNG/JPG/GIF, then WebP; fall back to a brand PNG.
 */

export const EMAIL_IMAGE_FALLBACK = '/logo-splash.png';

function galleryUrls(gallery) {
  if (!gallery) return [];
  let list = gallery;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [list.trim()].filter(Boolean);
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      return String(entry?.url || entry?.src || '').trim();
    })
    .filter((url) => url && !/\.(mp4|webm|mov)(\?|$)/i.test(url));
}

export function collectImageCandidates(...sources) {
  const out = [];
  const seen = new Set();
  const push = (value) => {
    const raw = String(value || '').trim();
    if (!raw || seen.has(raw)) return;
    seen.add(raw);
    out.push(raw);
  };
  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) {
      for (const entry of source) push(entry);
      continue;
    }
    if (typeof source === 'object') {
      push(source.image_url);
      push(source.imageUrl);
      push(source.image);
      push(source.hero_url);
      push(source.heroUrl);
      push(source.hoverImage);
      for (const url of galleryUrls(source.gallery)) push(url);
      for (const url of galleryUrls(source.media)) push(url);
      continue;
    }
    push(source);
  }
  return out;
}

function emailImageScore(url) {
  const path = String(url || '')
    .toLowerCase()
    .split('?')[0]
    .split('#')[0];
  if (!path) return 0;
  if (/product-placeholder/i.test(path) || /\.svg$/i.test(path)) return 0;
  if (/\.(png|jpe?g|gif)$/i.test(path)) return 40;
  if (/\.webp$/i.test(path)) return 25;
  // AVIF often renders blank in Gmail — treat as unusable for mail
  if (/\.avif$/i.test(path)) return 0;
  return 15;
}

/**
 * Pick the best mail-safe image from candidates (relative or absolute).
 * Returns a relative or absolute path — not yet site-prefixed.
 */
export function pickEmailSafeImage(candidates = []) {
  const ranked = collectImageCandidates(...candidates)
    .map((url) => ({ url, score: emailImageScore(url) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.url || EMAIL_IMAGE_FALLBACK;
}

export function resolveProductEmailImage(item, product) {
  return pickEmailSafeImage([item, product]);
}
