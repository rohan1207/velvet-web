import { createAdminSupabase } from '@/lib/supabase/admin';

export const COMPLETE_LOOK_DEFAULTS = {
  id: 'default',
  eyebrow: 'The edit',
  title: 'Shop the Complete Look',
  line: 'Tap the lights on each look — then open the matching set beside it.',
  looks: [
    {
      id: 'pearl-fairy-set',
      title: 'Pearl fringed look',
      line: 'Necklace and bracelet — one quiet language.',
      image: '/images/look-pearl-set-v2.jpg',
      alt: 'Model wearing the Fairy-Like Fringed pearl collarbone chain and matching bracelet',
      hotspots: [
        {
          id: 'necklace',
          productSlug: 'fairy-like-fringed-collarbone-chain-with-heart-shaped-pearl-bead-nck-016',
          x: 48,
          y: 58,
        },
        {
          id: 'bracelet',
          productSlug: 'fairy-like-fringed-bracelet-with-heart-shaped-pearl-bead-brc-028',
          x: 57,
          y: 48,
        },
      ],
    },
    {
      id: 'daisy-chain-set',
      title: 'Daisy chain look',
      line: 'Necklace, ring and bracelet — worn together.',
      image: '/images/look-daisy-set-v2.jpg',
      alt: 'Model wearing the Daisy necklace, ring and bracelet set with fine chain links',
      hotspots: [
        {
          id: 'necklace',
          productSlug: 'daisy-necklace-with-fine-chain-links-ywje0076',
          x: 51,
          y: 45,
        },
        {
          id: 'ring',
          productSlug: 'daisy-ring-with-fine-chain-links-ywje0077',
          x: 33,
          y: 52,
        },
        {
          id: 'bracelet',
          productSlug: 'daisy-bracelet-with-fine-chain-links-ywje0075',
          x: 39,
          y: 71,
        },
      ],
    },
  ],
  featuredSetSlugs: [
    'fairy-like-fringed-collarbone-chain-bracelet-with-heart-shaped-pearl-bea',
    'daisy-necklace-ring-bracelet-set-with-fine-chain-links-s02',
  ],
};

function normalizeHotspot(h, index) {
  return {
    id: String(h?.id || `spot-${index}`),
    productSlug: String(h?.productSlug || h?.product_slug || '').trim(),
    x: Math.min(100, Math.max(0, Number(h?.x) || 0)),
    y: Math.min(100, Math.max(0, Number(h?.y) || 0)),
  };
}

function normalizeLook(look, index) {
  const hotspots = Array.isArray(look?.hotspots)
    ? look.hotspots.map(normalizeHotspot).filter((h) => h.productSlug)
    : [];
  return {
    id: String(look?.id || `look-${index + 1}`),
    title: String(look?.title || '').trim(),
    line: String(look?.line || '').trim(),
    image: String(look?.image || '').trim(),
    alt: String(look?.alt || look?.title || 'Look').trim(),
    hotspots,
  };
}

export function mapCompleteLookRow(row) {
  if (!row) return { ...COMPLETE_LOOK_DEFAULTS };
  const looksRaw = Array.isArray(row.looks) ? row.looks : [];
  const looks = looksRaw.map(normalizeLook);
  const featured = Array.isArray(row.featured_set_slugs)
    ? row.featured_set_slugs.map(String).filter(Boolean)
    : [];
  return {
    id: 'default',
    eyebrow: String(row.eyebrow || COMPLETE_LOOK_DEFAULTS.eyebrow).trim(),
    title: String(row.title || COMPLETE_LOOK_DEFAULTS.title).trim(),
    line: String(row.line || COMPLETE_LOOK_DEFAULTS.line).trim(),
    looks: looks.length ? looks : COMPLETE_LOOK_DEFAULTS.looks,
    featuredSetSlugs: featured.length
      ? featured.slice(0, 4)
      : COMPLETE_LOOK_DEFAULTS.featuredSetSlugs,
    updatedAt: row.updated_at || null,
  };
}

export async function getCompleteLook() {
  try {
    const db = createAdminSupabase();
    const { data, error } = await db
      .from('homepage_complete_look')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw error;
    return mapCompleteLookRow(data);
  } catch (err) {
    console.error('[complete-look] load failed', err);
    return { ...COMPLETE_LOOK_DEFAULTS };
  }
}
