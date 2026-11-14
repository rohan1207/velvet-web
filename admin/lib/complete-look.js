import { createAdminSupabase } from '@/lib/supabase';

export const COMPLETE_LOOK_DEFAULTS = {
  id: 'default',
  eyebrow: 'The edit',
  title: 'Shop the Complete Look',
  line: 'Tap the lights on each look — then open the matching set beside it.',
  looks: [
    {
      id: 'look-1',
      title: 'Look 1',
      line: '',
      image: '',
      alt: '',
      hotspots: [],
    },
    {
      id: 'look-2',
      title: 'Look 2',
      line: '',
      image: '',
      alt: '',
      hotspots: [],
    },
  ],
  featuredSetSlugs: [],
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
    title: String(look?.title || `Look ${index + 1}`).trim(),
    line: String(look?.line || '').trim(),
    image: String(look?.image || '').trim(),
    alt: String(look?.alt || look?.title || `Look ${index + 1}`).trim(),
    hotspots,
  };
}

export function mapCompleteLookRow(row) {
  if (!row) return { ...COMPLETE_LOOK_DEFAULTS };
  const looksRaw = Array.isArray(row.looks) ? row.looks : [];
  let looks = looksRaw.map(normalizeLook);
  while (looks.length < 2) {
    looks.push({
      id: `look-${looks.length + 1}`,
      title: `Look ${looks.length + 1}`,
      line: '',
      image: '',
      alt: '',
      hotspots: [],
    });
  }
  looks = looks.slice(0, 2);
  const featured = Array.isArray(row.featured_set_slugs)
    ? row.featured_set_slugs.map(String).filter(Boolean)
    : [];
  return {
    id: 'default',
    eyebrow: String(row.eyebrow || COMPLETE_LOOK_DEFAULTS.eyebrow).trim(),
    title: String(row.title || COMPLETE_LOOK_DEFAULTS.title).trim(),
    line: String(row.line || COMPLETE_LOOK_DEFAULTS.line).trim(),
    looks,
    featuredSetSlugs: featured.slice(0, 2),
    updatedAt: row.updated_at || null,
  };
}

export async function getCompleteLook() {
  const db = createAdminSupabase();
  const { data, error } = await db
    .from('homepage_complete_look')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();
  if (error) throw error;
  return mapCompleteLookRow(data);
}

export async function saveCompleteLook(input) {
  const looks = (input.looks || []).slice(0, 2).map(normalizeLook);
  while (looks.length < 2) {
    looks.push(normalizeLook({}, looks.length));
  }
  const featuredSetSlugs = [
    ...new Set((input.featuredSetSlugs || []).map(String).filter(Boolean)),
  ].slice(0, 2);

  const row = {
    id: 'default',
    eyebrow: String(input.eyebrow ?? COMPLETE_LOOK_DEFAULTS.eyebrow).trim(),
    title: String(input.title ?? COMPLETE_LOOK_DEFAULTS.title).trim(),
    line: String(input.line ?? COMPLETE_LOOK_DEFAULTS.line).trim(),
    looks,
    featured_set_slugs: featuredSetSlugs,
    updated_at: new Date().toISOString(),
  };

  const db = createAdminSupabase();
  const { data, error } = await db
    .from('homepage_complete_look')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw error;
  return mapCompleteLookRow(data);
}
