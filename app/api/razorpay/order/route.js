import { NextResponse } from 'next/server';
import { allowDemoCheckout, razorpayLiveConfigured } from '@/lib/razorpay/verify-payment';
import { getRazorpayKeys } from '@/lib/razorpay/client';

export async function POST(request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `vs_${Date.now()}`;

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const { keyId, keySecret } = getRazorpayKeys();

    if (!razorpayLiveConfigured()) {
      if (!allowDemoCheckout()) {
        return NextResponse.json(
          {
            error:
              'Razorpay is not configured on this server. Orders cannot be charged.',
          },
          { status: 503 },
        );
      }
      return NextResponse.json({
        demo: true,
        key: keyId || null,
        amount: Math.round(amount * 100),
        currency,
        receipt,
        message:
          'Razorpay keys missing (local only). Demo checkout simulates success — never in production.',
      });
    }

    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: {
        source: 'velvet-shell',
      },
    });

    return NextResponse.json({
      demo: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
      receipt,
    });
  } catch (error) {
    console.error('Razorpay order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to create payment order' },
      { status: 500 },
    );
  }
}
