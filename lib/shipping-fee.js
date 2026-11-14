/**
 * Flat shipping on final merchandise (after discounts).
 * · ₹0–₹5 (payment-test / micro dummy orders) → free
 * · Below ₹3999 → ₹99
 * · ₹3999 and above → free
 */
export const FREE_SHIPPING_MIN_INR = 3999;
export const SHIPPING_FEE_INR = 99;
/** Tiny Razorpay smoke-test carts (e.g. ₹5 dummy ring) — no shipping. */
export const MICRO_ORDER_FREE_SHIPPING_MAX_INR = 5;

/**
 * @param {number} merchandisePayable subtotal − discount (before shipping)
 * @returns {number} 0 or 99
 */
export function shippingFeeForAmount(merchandisePayable) {
  const amount = Math.max(0, Number(merchandisePayable) || 0);
  if (amount <= MICRO_ORDER_FREE_SHIPPING_MAX_INR) return 0;
  return amount >= FREE_SHIPPING_MIN_INR ? 0 : SHIPPING_FEE_INR;
}

/**
 * Full order money breakdown.
 * @param {{ subtotal: number, discountAmount?: number, giftWrapFee?: number }} input
 */
export function computeOrderMoney({
  subtotal,
  discountAmount = 0,
  giftWrapFee = 0,
} = {}) {
  const goods = Math.max(0, Number(subtotal) || 0);
  const discount = Math.min(goods, Math.max(0, Number(discountAmount) || 0));
  const merchandisePayable = Math.max(0, goods - discount);
  const shippingFee = shippingFeeForAmount(merchandisePayable);
  const wrapFee = Math.max(0, Number(giftWrapFee) || 0);
  const total = merchandisePayable + shippingFee + wrapFee;
  return {
    subtotal: goods,
    discountAmount: discount,
    merchandisePayable,
    shippingFee,
    giftWrapFee: wrapFee,
    total,
    freeShipping: shippingFee === 0,
  };
}

export function shippingFeeLabel(shippingFee) {
  const fee = Math.max(0, Number(shippingFee) || 0);
  return fee > 0 ? `₹${fee}` : 'Free';
}

/** Short checkout / bag hint. */
export function shippingPolicyHint(merchandisePayable) {
  const amount = Math.max(0, Number(merchandisePayable) || 0);
  if (amount <= MICRO_ORDER_FREE_SHIPPING_MAX_INR) {
    return 'No shipping on this test / micro order';
  }
  if (amount >= FREE_SHIPPING_MIN_INR) {
    return 'Complimentary shipping on this order';
  }
  const need = FREE_SHIPPING_MIN_INR - amount;
  return `Shipping ₹${SHIPPING_FEE_INR} · add ₹${need.toLocaleString('en-IN')} more for free shipping`;
}
