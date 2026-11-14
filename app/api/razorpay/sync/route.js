import { NextResponse } from 'next/server';
import { createAuthRouteClient } from '@/lib/supabase/route';
import { persistPaidOrder } from '@/lib/orders/persist-order';
import { quoteOrder } from '@/lib/orders/quote-order';
import { isPaidOrderStatus } from '@/lib/orders';
import { assertRazorpayPaymentReceived } from '@/lib/razorpay/verify-payment';

/**
 * Confirm order ONLY when Razorpay reports payment captured for the exact total.
 * Cancel / fail / dismiss / insufficient funds → { paid: false } — no order created.
 */
export async function POST(request) {
  try {
    const { supabase, json } = createAuthRouteClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items = [],
      shipping = {},
      email,
      discountCode = '',
      giftWrap = false,
      giftMessage = '',
    } = body;

    // Ignore client `demo` — server decides via keys / env only.
    const orderEmail = String(email || user.email || shipping.email || '').trim().toLowerCase();
    const quote = await quoteOrder({
      items,
      email: orderEmail,
      discountCode,
      giftWrap,
      giftMessage,
    });

    const verified = await assertRazorpayPaymentReceived({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      expectedAmountInr: quote.finalTotal,
    });

    if (verified.pending) {
      return json({
        ok: true,
        paid: false,
        status: 'pending',
        reason: verified.reason || 'awaiting_payment',
      });
    }

    const { order, created } = await persistPaidOrder({
      userId: user.id,
      items,
      shipping,
      email: orderEmail,
      paymentId: verified.paymentId,
      razorpayOrderId: razorpayOrderId || null,
      razorpaySignature: verified.signature,
      demo: Boolean(verified.demo),
      paymentVerified: true,
      discountCode,
      giftWrap,
      giftMessage,
    });

    if (!isPaidOrderStatus(order.dbStatus) && order.status !== 'Confirmed') {
      return json({
        ok: true,
        paid: false,
        status: 'pending',
        reason: 'not_confirmed',
      });
    }

    return json({
      ok: true,
      paid: true,
      status: 'paid',
      created,
      order,
    });
  } catch (err) {
    console.error('[razorpay/sync]', err);
    return NextResponse.json(
      { error: err.message || 'Could not sync payment.', paid: false },
      { status: err.status || 500 },
    );
  }
}
