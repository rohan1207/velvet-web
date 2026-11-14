import {
  findCapturedPayment,
  getRazorpayClient,
  getRazorpayKeys,
  verifyCheckoutSignature,
} from '@/lib/razorpay/client';

/**
 * Live keys configured? Client cannot force "demo success".
 */
export function razorpayLiveConfigured() {
  const { keyId, keySecret } = getRazorpayKeys();
  return Boolean(keyId && keySecret);
}

/**
 * Demo checkout is ONLY allowed when Razorpay keys are missing AND not production.
 * Client-sent `demo: true` is never trusted when keys exist.
 */
export function allowDemoCheckout() {
  if (razorpayLiveConfigured()) return false;
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return false;
  }
  return true;
}

/**
 * Assert money was actually received for this Razorpay order.
 *
 * Returns:
 *   { pending: true }  — user cancelled, failed, still on UPI QR, etc. (NOT an order)
 *   { demo: true, paymentId } — local demo only (no keys)
 *   { pending: false, paymentId, payment, signature } — CAPTURED + amount matched
 *
 * Throws on tampering (wrong order, amount mismatch, bad signature).
 */
export async function assertRazorpayPaymentReceived({
  razorpayOrderId,
  razorpayPaymentId = null,
  razorpaySignature = null,
  expectedAmountInr,
}) {
  if (allowDemoCheckout()) {
    return {
      pending: false,
      demo: true,
      paymentId: razorpayPaymentId || `demo_${Date.now()}`,
      signature: null,
      payment: null,
    };
  }

  if (!razorpayLiveConfigured()) {
    throw Object.assign(
      new Error('Payments are not configured. Order cannot be confirmed.'),
      { status: 503 },
    );
  }

  if (!razorpayOrderId) {
    throw Object.assign(new Error('Missing payment order id.'), { status: 400 });
  }

  const expectedPaise = Math.round(Number(expectedAmountInr) * 100);
  if (!Number.isFinite(expectedPaise) || expectedPaise < 100) {
    throw Object.assign(new Error('Invalid order amount.'), { status: 400 });
  }

  const client = await getRazorpayClient();
  if (!client) {
    throw Object.assign(new Error('Payment gateway unavailable.'), { status: 503 });
  }

  let rzOrder;
  try {
    rzOrder = await client.orders.fetch(razorpayOrderId);
  } catch (err) {
    throw Object.assign(new Error('Payment order not found at Razorpay.'), {
      status: 400,
      cause: err,
    });
  }

  if (!rzOrder?.id || rzOrder.id !== razorpayOrderId) {
    throw Object.assign(new Error('Payment order not found.'), { status: 400 });
  }

  if (Number(rzOrder.amount) !== expectedPaise) {
    throw Object.assign(
      new Error('Payment amount does not match order total. Order not confirmed.'),
      { status: 400 },
    );
  }

  let payment = null;
  if (razorpayPaymentId) {
    try {
      payment = await client.payments.fetch(razorpayPaymentId);
    } catch (err) {
      throw Object.assign(new Error('Payment not found at Razorpay.'), {
        status: 400,
        cause: err,
      });
    }
  } else {
    payment = await findCapturedPayment(razorpayOrderId);
  }

  if (!payment?.id) {
    // Cancelled, closed modal, failed UPI, insufficient balance, still pending QR…
    return { pending: true, reason: 'no_payment' };
  }

  if (payment.order_id && payment.order_id !== razorpayOrderId) {
    throw Object.assign(new Error('Payment does not belong to this order.'), { status: 400 });
  }

  if (Number(payment.amount) !== expectedPaise) {
    throw Object.assign(
      new Error('Paid amount does not match order total. Order not confirmed.'),
      { status: 400 },
    );
  }

  // ONLY captured = money received. authorized / failed / created / refunded ≠ success.
  if (payment.status !== 'captured') {
    return {
      pending: true,
      reason: payment.status || 'not_captured',
      paymentId: payment.id,
    };
  }

  if (razorpaySignature) {
    const ok = verifyCheckoutSignature(razorpayOrderId, payment.id, razorpaySignature);
    if (!ok) {
      throw Object.assign(new Error('Invalid payment signature.'), { status: 400 });
    }
  }

  return {
    pending: false,
    demo: false,
    paymentId: payment.id,
    signature: razorpaySignature || null,
    payment,
  };
}
