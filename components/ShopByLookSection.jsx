import ShopByLook from '@/components/ShopByLook';
import { getCompleteLook } from '@/lib/complete-look';
import { listActiveSets } from '@/lib/sets';

/**
 * Server wrapper — loads admin-curated complete look + live set cards.
 */
export default async function ShopByLookSection() {
  const config = await getCompleteLook();

  let featuredSets = [];
  try {
    const sets = await listActiveSets();
    const bySlug = new Map((sets || []).map((s) => [s.slug, s]));
    featuredSets = (config.featuredSetSlugs || [])
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .slice(0, 2)
      .map((set) => ({
        slug: set.slug,
        name: set.name,
        price: set.price,
        image: set.image,
        href: `/sets/${set.slug}`,
        pieceCount: Array.isArray(set.members) ? set.members.length : 0,
        badge: set.badge || '',
        outOfStock: set.outOfStock,
        members: (set.members || []).map((m) => ({
          slug: m.slug,
          name: m.name,
          price: m.price,
          image: m.image,
        })),
      }));
  } catch {
    featuredSets = [];
  }

  return (
    <ShopByLook
      eyebrow={config.eyebrow}
      title={config.title}
      line={config.line}
      looks={config.looks}
      featuredSets={featuredSets}
    />
  );
}
