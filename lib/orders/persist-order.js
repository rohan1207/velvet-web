import { createAdminSupabase } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/auth/mail';
import { fromDbOrder, generateOrderNumber, isPaidOrderStatus } from '@/lib/orders';
import { loadCatalog, productFromCatalog } from '@/lib/catalog';
import { getProduct } from '@/lib/products';
import { applyPromoCode, recordPromoRedemption } from '@/lib/discounts/apply';
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

function toClientOrder(row, items, paymentId) {
  const order = fromDbOrder(row, items || row.order_items || []);
  order.paymentId = paymentId || order.paymentId || null;
  return order;
}

/**
 * Create a paid storefront order (idempotent on razorpay_order_id / payment id).
 *
 * Call ONLY after assertRazorpayPaymentReceived() confirms capture (or local demo).
 * Never mark paid without paymentVerified=true from the API gate.
 */
export async function persistPaidOrder({
  userId,
  items = [],
  shipping = {},
  email,
  paymentId,
  razorpayOrderId,
  razorpaySignature,
  demo = false,
  paymentVerified = false,
  discountCode = '',
  giftWrap: giftWrapRequested = false,
  giftMessage: giftMessageRequested = '',
}) {
  if (!paymentVerified) {
    throw Object.assign(
      new Error('Payment not verified. Order was not created.'),
      { status: 402 },
    );
  }

  if (!demo && !paymentId) {
    throw Object.assign(
      new Error('Missing payment id. Order was not created.'),
      { status: 402 },
    );
  }

  if (!Array.isArray(items) || !items.length) {
    throw Object.assign(new Error('Cart is empty.'), { status: 400 });
  }

  const orderEmail = String(email || shipping.email || '').trim().toLowerCase();
  if (!orderEmail) {
    throw Object.assign(new Error('Email is required.'), { status: 400 });
  }

  const admin = createAdminSupabase();

  if (razorpayOrderId) {
    const { data: existing } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();
    if (existing) {
      if (isPaidOrderStatus(existing.status)) {
        return {
          order: toClientOrder(existing, existing.order_items, paymentId),
          created: false,
        };
      }
      // Upgrade pending_payment → paid after verified capture
      if (existing.status === 'pending_payment') {
        await admin
          .from('orders')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (paymentId) {
          await admin.from('payments').insert({
            order_id: existing.id,
            razorpay_order_id: razorpayOrderId || null,
            razorpay_payment_id: paymentId,
            razorpay_signature: razorpaySignature || null,
            amount: existing.total,
            currency: 'INR',
            status: 'captured',
            raw: { demo: Boolean(demo), upgraded: true },
            idempotency_key: paymentId,
          }).catch(() => null);
        }
        try {
          await sendOrderEmails({
            order: {
              ...existing,
              status: 'paid',
              razorpay_payment_id: paymentId,
              paymentMethod: demo ? 'Demo (Razorpay)' : 'Razorpay',
            },
            items: existing.order_items || [],
            customerName: existing.shipping?.fullName || '',
          });
        } catch (mailErr) {
          console.error('[orders] email failed', mailErr);
        }
        return {
          order: toClientOrder(
            { ...existing, status: 'paid' },
            existing.order_items,
            paymentId,
          ),
          created: false,
        };
      }
    }
  }

  if (paymentId) {
    const { data: existingPay } = await admin
      .from('payments')
      .select('order_id')
      .eq('razorpay_payment_id', paymentId)
      .maybeSingle();
    if (existingPay?.order_id) {
      const { data: existing } = await admin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', existingPay.order_id)
        .maybeSingle();
      if (existing && isPaidOrderStatus(existing.status)) {
        return {
          order: toClientOrder(existing, existing.order_items, paymentId),
          created: false,
        };
      }
    }
  }

  const catalog = await loadCatalog().catch(() => null);

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
      // Prefer JPG/PNG for order emails (Gmail blanks SVG/AVIF)
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

  const shippingPayload = {
    fullName: shipping.fullName || [shipping.firstName, shipping.lastName].filter(Boolean).join(' '),
    firstName: shipping.firstName || '',
    lastName: shipping.lastName || '',
    email: orderEmail,
    phone: shipping.phone || '',
    line1: shipping.line1 || shipping.address || '',
    line2: shipping.line2 || '',
    city: shipping.city || '',
    state: shipping.state || '',
    postal: shipping.postal || '',
    country: shipping.country || 'India',
    addressId: shipping.addressId || null,
  };

  const orderNumber = generateOrderNumber();

  const orderPayload = {
    order_number: orderNumber,
    user_id: userId,
    email: orderEmail,
    status: 'paid',
    subtotal: finalSubtotal,
    shipping_fee: finalShipping,
    total: finalTotal,
    currency: 'INR',
    shipping: shippingPayload,
    razorpay_order_id: razorpayOrderId || null,
    notes: [
      demo ? 'Demo payment' : '',
      appliedCode ? `Promo ${appliedCode} (−₹${discountAmount})` : '',
      gift.giftWrap ? `Gift wrap (+₹${gift.giftWrapFee})` : '',
      gift.giftMessage ? 'Gift message included' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    discount_code: appliedCode,
    discount_amount: discountAmount,
    discount_id: discountId,
    gift_wrap: gift.giftWrap,
    gift_wrap_fee: gift.giftWrapFee,
    gift_message: gift.giftMessage,
  };

  let { data: orderRow, error: orderErr } = await admin
    .from('orders')
    .insert(orderPayload)
    .select('*')
    .single();

  if (
    orderErr &&
    /discount_code|discount_amount|discount_id|gift_wrap|gift_message/i.test(
      orderErr.message || '',
    )
  ) {
    const {
      discount_code: _dc,
      discount_amount: _da,
      discount_id: _di,
      gift_wrap: _gw,
      gift_wrap_fee: _gf,
      gift_message: _gm,
      ...withoutExtraCols
    } = orderPayload;
    let retryPayload = withoutExtraCols;
    if (!/gift_wrap|gift_message/i.test(orderErr.message || '')) {
      retryPayload = {
        ...withoutExtraCols,
        gift_wrap: gift.giftWrap,
        gift_wrap_fee: gift.giftWrapFee,
        gift_message: gift.giftMessage,
      };
    } else if (!/discount_code|discount_amount|discount_id/i.test(orderErr.message || '')) {
      retryPayload = {
        ...withoutExtraCols,
        discount_code: appliedCode,
        discount_amount: discountAmount,
        discount_id: discountId,
      };
    }
    const retry = await admin.from('orders').insert(retryPayload).select('*').single();
    orderRow = retry.data
      ? {
          ...retry.data,
          discount_code: appliedCode,
          discount_amount: discountAmount,
          gift_wrap: gift.giftWrap,
          gift_wrap_fee: gift.giftWrapFee,
          gift_message: gift.giftMessage,
        }
      : retry.data;
    orderErr = retry.error;
  }

  // Race: another request inserted the same razorpay_order_id
  if (orderErr && razorpayOrderId && /razorpay_order_id|duplicate|unique/i.test(orderErr.message || '')) {
    const { data: existing } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();
    if (existing) {
      const order = fromDbOrder(existing, existing.order_items);
      order.paymentId = paymentId || order.paymentId || null;
      return { order, created: false };
    }
  }

  if (orderErr) throw orderErr;

  const itemsWithOrder = lineRows.map((row) => ({ ...row, order_id: orderRow.id }));
  let { data: insertedItems, error: itemsErr } = await admin
    .from('order_items')
    .insert(itemsWithOrder)
    .select('*');

  if (itemsErr && /sku|color_label/i.test(itemsErr.message || '')) {
    const stripped = itemsWithOrder.map(({ sku: _s, color_label: _c, ...rest }) => rest);
    const retry = await admin.from('order_items').insert(stripped).select('*');
    insertedItems = (retry.data || []).map((row, i) => ({
      ...row,
      sku: itemsWithOrder[i]?.sku || '',
      color_label: itemsWithOrder[i]?.color_label || '',
    }));
    itemsErr = retry.error;
  }

  if (itemsErr) throw itemsErr;

  if (paymentId || razorpayOrderId) {
    const { error: payErr } = await admin.from('payments').insert({
      order_id: orderRow.id,
      razorpay_order_id: razorpayOrderId || null,
      razorpay_payment_id: paymentId || null,
      razorpay_signature: razorpaySignature || null,
      amount: finalTotal,
      currency: 'INR',
      status: 'captured',
      raw: { demo: Boolean(demo) },
      idempotency_key: paymentId || `demo_${orderRow.id}`,
    });
    if (payErr && !/duplicate|unique|idempotency/i.test(payErr.message || '')) {
      console.error('[orders] payment insert failed', payErr);
    }
  }

  if (discountId && discountAmount > 0) {
    try {
      await recordPromoRedemption({
        discountId,
        orderId: orderRow.id,
        orderNumber,
        customerEmail: orderEmail,
        discountAmount,
        orderSubtotal: finalSubtotal,
        orderTotal: finalTotal,
      });
    } catch (redErr) {
      console.error('[orders] discount redemption failed', redErr);
    }
  }

  try {
    await sendOrderEmails({
      order: {
        ...orderRow,
        discount_code: orderRow.discount_code || appliedCode || '',
        discount_amount: orderRow.discount_amount ?? discountAmount ?? 0,
        gift_wrap: orderRow.gift_wrap ?? gift.giftWrap,
        gift_wrap_fee: orderRow.gift_wrap_fee ?? gift.giftWrapFee,
        gift_message: orderRow.gift_message ?? gift.giftMessage,
        razorpay_payment_id: paymentId || orderRow.razorpay_payment_id || null,
        razorpay_order_id: razorpayOrderId || orderRow.razorpay_order_id || null,
        paymentId: paymentId || null,
        paymentMethod: demo ? 'Demo (Razorpay)' : 'Razorpay',
        demo: Boolean(demo),
      },
      items: insertedItems || itemsWithOrder,
      customerName: shippingPayload.fullName,
    });
  } catch (mailErr) {
    console.error('[orders] email failed', mailErr);
  }

  const order = fromDbOrder(
    {
      ...orderRow,
      gift_wrap: orderRow.gift_wrap ?? gift.giftWrap,
      gift_wrap_fee: orderRow.gift_wrap_fee ?? gift.giftWrapFee,
      gift_message: orderRow.gift_message ?? gift.giftMessage,
    },
    insertedItems || itemsWithOrder,
  );
  order.paymentId = paymentId || null;
  order.discountCode = appliedCode;
  order.discountAmount = discountAmount;

  return { order, created: true };
}
