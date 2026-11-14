import { Resend } from 'resend';
import { createAdminSupabase } from '@/lib/supabase';
import { allowInsecureTlsIfConfigured } from '@/lib/tls';
import {
  fromAddress,
  lookLikeEmail,
  siteUrl,
  renderStockAvailableEmail,
} from '@/lib/email/templates';

/**
 * Email waitlist for a product or set slug, then delete those rows.
 * Pass alsoSlugs (e.g. family slug) so Notify-me on either slug is covered.
 */
export async function flushStockNotify({
  kind = 'product',
  slug,
  name,
  alsoSlugs = [],
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
  const { subject, html } = renderStockAvailableEmail({
    productName: displayName,
    productUrl: url,
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
