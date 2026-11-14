import crypto from 'crypto';

export function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return { keyId, keySecret };
}

export async function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayKeys();
  if (!keyId || !keySecret) return null;
  const Razorpay = (await import('razorpay')).default;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Find a CAPTURED payment for a Razorpay order id.
 * authorized / created / failed do NOT count — money must be received.
 */
export async function findCapturedPayment(razorpayOrderId) {
  const client = await getRazorpayClient();
  if (!client || !razorpayOrderId) return null;

  const result = await client.orders.fetchPayments(razorpayOrderId);
  const items = Array.isArray(result?.items) ? result.items : [];
  return items.find((p) => p.status === 'captured') || null;
}

export function verifyCheckoutSignature(orderId, paymentId, signature) {
  const { keySecret } = getRazorpayKeys();
  if (!keySecret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}
