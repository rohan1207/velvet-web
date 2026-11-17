import { Resend } from 'resend';
import { createAdminSupabase } from '@/lib/supabase';
import { allowInsecureTlsIfConfigured } from '@/lib/tls';
import {
  fromAddress,
  lookLikeEmail,
  siteUrl,
  renderStockAvailableEmail,
} from '@/lib/email/templates';
import { pickEmailSafeImage } from '@/lib/email/image';

function firstGalleryUrl(gallery) {
  if (!gallery) return '';
  if (typeof gallery === 'string') {
    try {
      gallery = JSON.parse(gallery);
    } catch {
      return gallery.trim();
    }
  }
  if (!Array.isArray(gallery) || !gallery.length) return '';
  const first = gallery[0];
  if (typeof first === 'string') return first.trim();
  return String(first?.url || first?.src || '').trim();
}

async function resolveNotifyImage(db, kindValue, slugs, imageUrl) {
  const candidates = [String(imageUrl || '').trim()].filter(Boolean);

  if (kindValue === 'set') {
    const { data } = await db
      .from('product_sets')
      .select('hero_url')
      .in('slug', slugs)
      .limit(1);
    candidates.push(String(data?.[0]?.hero_url || '').trim());
    return pickEmailSafeImage(candidates);
  }

  const { data: variants } = await db
    .from('product_color_variants')
    .select('hero_url, gallery, slug')
    .in('slug', slugs)
    .limit(8);
  for (const v of variants || []) {
    candidates.push(String(v.hero_url || '').trim(), firstGalleryUrl(v.gallery));
  }

  const { data: families } = await db
    .from('product_families')
    .select('id, slug')
    .in('slug', slugs)
    .limit(4);
  const familyIds = (families || []).map((f) => f.id).filter(Boolean);
  if (familyIds.length) {
    const { data: familyVariants } = await db
      .from('product_color_variants')
      .select('hero_url, gallery')
      .in('family_id', familyIds)
      .limit(8);
    for (const v of familyVariants || []) {
      candidates.push(String(v.hero_url || '').trim(), firstGalleryUrl(v.gallery));
    }
  }
  return pickEmailSafeImage(candidates);
}

/**
 * Email waitlist for a product or set slug, then delete those rows.
 * Pass alsoSlugs (e.g. family slug) so Notify-me on either slug is covered.
 */
export async function flushStockNotify({
  kind = 'product',
  slug,
  name,
  alsoSlugs = [],
  imageUrl = '',
}) {
  allowInsecureTlsIfConfigured();
  const kindValue = kind === 'set' ? 'set' : 'product';
  const slugs = [
    ...new Set(
      [slug, ...(alsoSlugs || [])]
        .map((s) => String(s || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (!slugs.length) return { sent: 0 };

  const db = createAdminSupabase();
  const { data: rows, error } = await db
    .from('stock_notify_requests')
    .select('id,email,product_name,target_slug')
    .eq('kind', kindValue)
    .in('target_slug', slugs);
  if (error) throw error;
  if (!rows?.length) return { sent: 0, cleared: 0 };

  const resendKey = process.env.RESEND_API_KEY;
  const linkSlug = slugs[0];
  const path = kindValue === 'set' ? `/sets/${linkSlug}` : `/shop/${linkSlug}`;
  const url = `${siteUrl()}${path}`;
  const displayName = name || rows[0].product_name || linkSlug;
  let productImage = '';
  try {
    productImage = await resolveNotifyImage(db, kindValue, slugs, imageUrl);
  } catch (err) {
    console.error('[stock-notify] image lookup', err);
  }

  const { subject, html } = renderStockAvailableEmail({
    productName: displayName,
    productUrl: url,
    productImage,
  });

  let sent = 0;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const from = fromAddress();
    const seenEmails = new Set();
    for (const row of rows) {
      const to = String(row.email || '')
        .trim()
        .toLowerCase();
      if (!lookLikeEmail(to) || seenEmails.has(to)) continue;
      seenEmails.add(to);
      try {
        const { error: mailErr } = await resend.emails.send({
          from,
          to: [to],
          subject,
          html,
        });
        if (!mailErr) sent += 1;
        else console.error('[stock-notify] mail', mailErr);
      } catch (err) {
        console.error('[stock-notify] mail', err);
      }
    }
  } else {
    console.warn(
      '[stock-notify] RESEND_API_KEY missing — clearing waitlist without mail',
    );
  }

  const ids = rows.map((r) => r.id);
  await db.from('stock_notify_requests').delete().in('id', ids);
  return { sent, cleared: ids.length };
}
