import { loadCatalog, productFromCatalog } from '@/lib/catalog';
import { getProduct } from '@/lib/products';
import { applyPromoCode } from '@/lib/discounts/apply';
import { shippingFeeForAmount } from '@/lib/shipping-fee';
import { loadGiftOptions, resolveGiftSelection } from '@/lib/gift-options';
import { resolveProductEmailImage } from '@/lib/email/image';

function skuFromFeatures(features) {
  if (!Array.isArray(features)) return '';
  const hit = features.find((f) => /^SKU\s/i.test(String(f)));
  return hit ? String(hit).replace(/^SKU\s+/i, '').trim() : '';
}

function resolveSku(product, item) {
  return String(
    item?.sku ||
      product?.sku ||
      skuFromFeatures(product?.details) ||
      skuFromFeatures(product?.features) ||
      '',
  ).trim();
}

/**
 * Server-side price quote — never trust client totals for payment verification.
 */
export async function quoteOrder({
  items = [],
  email = '',
  discountCode = '',
  giftWrap: giftWrapRequested = false,
  giftMessage: giftMessageRequested = '',
}) {
  if (!Array.isArray(items) || !items.length) {
    throw Object.assign(new Error('Cart is empty.'), { status: 400 });
  }

  const catalog = await loadCatalog().catch(() => null);
  const orderEmail = String(email || '').trim().toLowerCase();

  const lineRows = items.map((item) => {
    const live = catalog ? productFromCatalog(catalog, item.slug) : null;
    const product = live || getProduct(item.slug) || {};
    const unit = Number(item.price ?? product.price) || 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    const customization = Array.isArray(item.customization)
      ? item.customization
          .map((entry) => ({
            id: String(entry?.id || ''),
            label: String(entry?.label || '').trim(),
            value: String(entry?.value ?? '').trim(),
          }))
          .filter((entry) => entry.label && entry.value)
      : [];
    const sku = resolveSku(product, item);
    const colorLabel = String(
      item.colorLabel || item.color || product.colorLabel || '',
    ).trim();
    return {
      product_slug: item.slug,
      product_name: item.name || product.name || item.slug,
      image_url:
        resolveProductEmailImage(item, product) ||
        item.image ||
        product.image ||
        product.image_url ||
        null,
      size: item.size || 'OS',
      metal: item.metal || item.color || product.material || '—',
      sku,
      color_label: colorLabel,
      unit_price: unit,
      qty,
      line_total: unit * qty,
      customization,
    };
  });

  const finalSubtotal = lineRows.reduce((s, l) => s + l.line_total, 0);

  let discountAmount = 0;
  let appliedCode = '';
  let discountId = null;
  if (discountCode) {
    const promo = await applyPromoCode({
      code: discountCode,
      lines: lineRows.map((row) => {
        const live = catalog ? productFromCatalog(catalog, row.product_slug) : null;
        return {
          slug: row.product_slug,
          qty: row.qty,
          price: row.unit_price,
          category: live?.category || '',
          collection: live?.collection || '',
        };
      }),
      customerEmail: orderEmail,
    });
    if (promo.ok) {
      discountAmount = promo.discountAmount;
      appliedCode = promo.code;
      discountId = promo.discountId;
    }
  }

  const merchandise = Math.max(0, finalSubtotal - discountAmount);
  const finalShipping = shippingFeeForAmount(merchandise);
  const giftSettings = await loadGiftOptions();
  const gift = resolveGiftSelection(giftSettings, {
    giftWrap: giftWrapRequested,
    giftMessage: giftMessageRequested,
  });
  const finalTotal = merchandise + finalShipping + gift.giftWrapFee;

  return {
    lineRows,
    finalSubtotal,
    discountAmount,
    appliedCode,
    discountId,
    finalShipping,
    gift,
    finalTotal,
  };
}
