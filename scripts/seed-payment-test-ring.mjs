/**
 * Inserts a ₹5 active dummy ring for Razorpay / checkout testing.
 *
 *   node --env-file=.env.local scripts/seed-payment-test-ring.mjs
 */
import { createClient } from '@supabase/supabase-js';

// Windows AV/proxy often breaks Node TLS to Supabase
if (process.env.SUPABASE_INSECURE_TLS === '1' || !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SLUG = 'payment-test-ring-5rs';
const HERO = '/images/product-placeholder.svg';

const family = {
  slug: SLUG,
  name: 'Payment Test Ring (₹5)',
  category: 'rings',
  collection_slug: 'the-shell-edit',
  has_color_variants: false,
  customization_enabled: false,
  customization_fields: [],
  shipping: {
    intro: 'TEST PRODUCT — do not ship. For payment gateway verification only.',
    regions: [{ location: 'India', eta: 'N/A (test)' }],
    note: 'Dummy SKU for Razorpay live/test checkout.',
    delayed: '',
    returnsNote: '',
  },
  recommended_family_ids: [],
  badge: 'TEST',
  status: 'active',
  active: true,
  updated_at: new Date().toISOString(),
};

const variant = {
  slug: SLUG,
  color_label: 'Default',
  color_swatch: '#C9A227',
  is_primary: true,
  price: 5,
  description:
    'Dummy ring created for end-to-end payment testing. Price is ₹5. Safe to buy and refund.',
  story: 'Internal QA product — random test data, not a real catalogue piece.',
  care: 'N/A — test item.',
  features: ['Payment test only', '₹5 Razorpay check', 'Rings category'],
  material: 'Test alloy (dummy)',
  length_label: 'Size 12 (test)',
  size_tags: ['12', '14', '16'],
  reviews: { rating: 5, count: 1, highlights: ['Gateway smoke test'] },
  hero_url: HERO,
  gallery: [{ url: HERO, kind: 'image', alt: 'Payment test ring placeholder' }],
  stock: 99,
  out_of_stock: false,
  active: true,
  sort_order: 0,
  updated_at: new Date().toISOString(),
};

async function main() {
  const { data: existing } = await db
    .from('product_families')
    .select('id')
    .eq('slug', SLUG)
    .maybeSingle();

  let familyId = existing?.id;

  if (familyId) {
    const { error } = await db.from('product_families').update(family).eq('id', familyId);
    if (error) throw error;
    console.log('Updated family', familyId);
  } else {
    const { data, error } = await db
      .from('product_families')
      .insert(family)
      .select('id')
      .single();
    if (error) throw error;
    familyId = data.id;
    console.log('Created family', familyId);
  }

  const { data: existingVar } = await db
    .from('product_color_variants')
    .select('id')
    .eq('family_id', familyId)
    .eq('slug', SLUG)
    .maybeSingle();

  const variantRow = { ...variant, family_id: familyId };

  if (existingVar?.id) {
    const { error } = await db
      .from('product_color_variants')
      .update(variantRow)
      .eq('id', existingVar.id);
    if (error) throw error;
    console.log('Updated variant', existingVar.id);
  } else {
    const { data, error } = await db
      .from('product_color_variants')
      .insert(variantRow)
      .select('id')
      .single();
    if (error) throw error;
    console.log('Created variant', data.id);
  }

  console.log('\nOK — ₹5 test ring is live in catalog');
  console.log(`  slug:     ${SLUG}`);
  console.log(`  category: rings`);
  console.log(`  price:    ₹5`);
  console.log(`  shop:     /shop/${SLUG}`);
  console.log(`  filter:   /shop?category=rings`);
}

main().catch((err) => {
  console.error(err.message || err);
  if (err.cause) console.error('cause:', err.cause);
  process.exit(1);
});
