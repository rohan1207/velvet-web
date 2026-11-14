import { NextResponse } from 'next/server';
import { createAuthRouteClient } from '@/lib/supabase/route';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { fromDbOrder, isPaidOrderStatus } from '@/lib/orders';
import { persistPaidOrder } from '@/lib/orders/persist-order';
import { quoteOrder } from '@/lib/orders/quote-order';
import { assertRazorpayPaymentReceived } from '@/lib/razorpay/verify-payment';

export async function GET(request) {
  try {
    const { supabase, json } = createAuthRouteClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.', orders: [] }, { status: 401 });
    }

    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Never surface unpaid drafts as successful orders in the account UI.
    const orders = (data || [])
      .filter((row) => isPaidOrderStatus(row.status) || row.status === 'cancelled' || row.status === 'refunded')
      .map((row) => fromDbOrder(row, row.order_items));

    return json({ orders });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Could not load orders.', orders: [] },
      { status: 500 },
    );
  }
}

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
      items = [],
      shipping = {},
      email,
      paymentId,
      razorpayOrderId,
      razorpaySignature,
      discountCode = '',
      giftWrap: giftWrapRequested = false,
      giftMessage: giftMessageRequested = '',
    } = body;

    // Client `demo` is ignored. Server verifies capture (or allows local demo only).
    const orderEmail = String(email || user.email || shipping.email || '').trim().toLowerCase();
    const quote = await quoteOrder({
      items,
      email: orderEmail,
      discountCode,
      giftWrap: giftWrapRequested,
      giftMessage: giftMessageRequested,
    });

    const verified = await assertRazorpayPaymentReceived({
      razorpayOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature,
      expectedAmountInr: quote.finalTotal,
    });

    if (verified.pending) {
      return NextResponse.json(
        {
          error:
            'Payment not received yet. Complete payment in Razorpay — the order will confirm only after success.',
          paid: false,
        },
        { status: 402 },
      );
    }

    const { order } = await persistPaidOrder({
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
      giftWrap: giftWrapRequested,
      giftMessage: giftMessageRequested,
    });

    return json({ ok: true, order }, { status: 201 });
  } catch (err) {
    console.error('[orders] create failed', err);
    return NextResponse.json(
      { error: err.message || 'Could not place order.', paid: false },
      { status: err.status || 500 },
    );
  }
}
