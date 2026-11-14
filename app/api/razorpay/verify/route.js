import { NextResponse } from 'next/server';
import {
  getRazorpayClient,
  verifyCheckoutSignature,
} from '@/lib/razorpay/client';
import {
  allowDemoCheckout,
  razorpayLiveConfigured,
} from '@/lib/razorpay/verify-payment';

/**
 * Handler pre-check: payment must be CAPTURED at Razorpay.
 * Order creation still goes through /api/razorpay/sync or /api/orders
 * which re-checks amount vs cart total.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      demo,
    } = body;

    if (demo && allowDemoCheckout()) {
      return NextResponse.json({ ok: true, demo: true });
    }

    if (!razorpayLiveConfigured()) {
      if (allowDemoCheckout()) {
        return NextResponse.json({ ok: true, demo: true });
      }
      return NextResponse.json(
        { ok: false, error: 'Payments are not configured.' },
        { status: 503 },
      );
    }

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { ok: false, error: 'Missing payment details.' },
        { status: 400 },
      );
    }

    if (
      razorpay_signature &&
      !verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payment signature.' },
        { status: 400 },
      );
    }

    const client = await getRazorpayClient();
    const payment = await client.payments.fetch(razorpay_payment_id);

    if (!payment?.id) {
      return NextResponse.json(
        { ok: false, error: 'Payment not found.', pending: true },
        { status: 402 },
      );
    }

    if (payment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { ok: false, error: 'Payment does not belong to this order.' },
        { status: 400 },
      );
    }

    if (payment.status !== 'captured') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Payment not completed yet.',
          pending: true,
          reason: payment.status,
        },
        { status: 402 },
      );
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      amountPaise: payment.amount,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Verify failed' },
      { status: 500 },
    );
  }
}
