/**
 * Recover a live Razorpay payment that never created a local order
 * (browser handler / UPI QR never completed checkout).
 *
 *   node --env-file=.env.local scripts/recover-razorpay-payment.mjs pay_xxxxx
 *
 * Optional env / flags:
 *   --email=you@example.com
 *   --name="Full Name"
 *   --phone=91xxxxxxxxxx
 *   --slug=payment-test-ring-5rs
 *   --qty=1
 *   --gift-wrap=1
 */
import { createClient } from '@supabase/supabase-js';

if (process.env.SUPABASE_INSECURE_TLS === '1' || !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

function arg(name, fallback = '') {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const paymentId = process.argv.find((a) => /^pay_/.test(a));
if (!paymentId) {
  console.error('Usage: node --env-file=.env.local scripts/recover-razorpay-payment.mjs pay_xxxxx');
  process.exit(1);
}

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

if (!keyId || !keySecret || !url || !serviceKey) {
  console.error('Missing Razorpay or Supabase env');
  process.exit(1);
}

const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
  headers: { Authorization: `Basic ${auth}` },
});
const payment = await payRes.json();
if (!payRes.ok) {
  console.error(payment);
  process.exit(1);
}

console.log('Payment:', {
  id: payment.id,
  status: payment.status,
  amount: payment.amount / 100,
  order_id: payment.order_id,
  email: payment.email,
  contact: payment.contact,
});

if (!['captured', 'authorized'].includes(payment.status)) {
  console.error('Payment is not captured/authorized');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingPay } = await db
  .from('payments')
  .select('order_id')
  .eq('razorpay_payment_id', paymentId)
  .maybeSingle();
if (existingPay?.order_id) {
  console.log('Already linked to order', existingPay.order_id);
  process.exit(0);
}

if (payment.order_id) {
  const { data: existingOrder } = await db
    .from('orders')
    .select('id, order_number')
    .eq('razorpay_order_id', payment.order_id)
    .maybeSingle();
  if (existingOrder) {
    console.log('Order already exists', existingOrder);
    process.exit(0);
  }
}

const email = (arg('email') || payment.email || '').toLowerCase();
const fullName = arg('name') || 'Customer';
const phone = arg('phone') || payment.contact || '';
const slug = arg('slug') || 'payment-test-ring-5rs';
const qty = Math.max(1, Number(arg('qty', '1')) || 1);
const giftWrap = arg('gift-wrap', '1') === '1';
const giftWrapFee = giftWrap ? 25 : 0;

const { data: family } = await db
  .from('product_families')
  .select('id, name, slug')
  .eq('slug', slug)
  .maybeSingle();
const { data: variant } = family?.id
  ? await db
      .from('product_color_variants')
      .select('price, hero_url, color_label')
      .eq('family_id', family.id)
      .eq('is_primary', true)
      .maybeSingle()
  : { data: null };

const unit = Number(variant?.price) || 5;
const subtotal = unit * qty;
const paidTotal = Math.round(Number(payment.amount) / 100);
// Micro / ₹5 dummy carts: no shipping (same rule as lib/shipping-fee.js)
const shippingFee = subtotal <= 5 ? 0 : Math.max(0, paidTotal - subtotal - giftWrapFee);

const { data: profile } = email
  ? await db.from('profiles').select('id').eq('email', email).maybeSingle()
  : { data: null };

const orderNumber = `VS-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random()
  .toString(36)
  .toUpperCase()
  .slice(2, 5)}`;

const shipping = {
  fullName,
  firstName: fullName.split(/\s+/)[0] || 'Customer',
  lastName: fullName.split(/\s+/).slice(1).join(' ') || '',
  email,
  phone,
  line1: arg('line1') || 'Recovered from Razorpay',
  line2: '',
  city: arg('city') || '',
  state: arg('state') || '',
  postal: arg('postal') || '',
  country: 'India',
};

const { data: orderRow, error: orderErr } = await db
  .from('orders')
  .insert({
    order_number: orderNumber,
    user_id: profile?.id || null,
    email: email || 'unknown@example.com',
    status: 'paid',
    subtotal,
    shipping_fee: shippingFee,
    total: paidTotal,
    currency: 'INR',
    shipping,
    razorpay_order_id: payment.order_id || null,
    notes: 'Recovered after live UPI — browser handler never completed',
    gift_wrap: giftWrap,
    gift_wrap_fee: giftWrapFee,
    gift_message: '',
  })
  .select('*')
  .single();

if (orderErr) {
  console.error(orderErr);
  process.exit(1);
}

const { error: itemErr } = await db.from('order_items').insert({
  order_id: orderRow.id,
  product_slug: slug,
  product_name: family?.name || slug,
  image_url: variant?.hero_url || null,
  size: 'OS',
  metal: variant?.color_label || '—',
  unit_price: unit,
  qty,
  line_total: subtotal,
  customization: [],
});
if (itemErr) console.error('items', itemErr);

const { error: payErr } = await db.from('payments').insert({
  order_id: orderRow.id,
  razorpay_order_id: payment.order_id || null,
  razorpay_payment_id: paymentId,
  amount: paidTotal,
  currency: 'INR',
  status: 'captured',
  raw: payment,
  idempotency_key: paymentId,
});
if (payErr) console.error('payments', payErr);

console.log('\nOK recovered');
console.log('  order:', orderRow.order_number, orderRow.id);
console.log('  total: ₹' + paidTotal);
console.log('  Re-send emails from admin → Orders → Notify if needed.');
