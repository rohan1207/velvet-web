import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/auth/mail';

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
  } catch {
    return expected === signature;
  }
}

/**
 * Razorpay Dashboard → Webhooks → URL:
 *   https://YOUR_DOMAIN/api/webhooks/razorpay
 * Events: payment.captured, order.paid
 *
 * Marks an existing DB order paid when the browser handler never fires.
 * Primary fulfilment for live UPI is /api/razorpay/sync (client poll).
 */
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event?.event || '';
  if (type !== 'payment.captured' && type !== 'order.paid') {
    return NextResponse.json({ ok: true, ignored: type });
  }

  try {
    const payment = event?.payload?.payment?.entity || null;
    const orderEntity = event?.payload?.order?.entity || null;

    const razorpayOrderId = payment?.order_id || orderEntity?.id || null;
    const paymentId = payment?.id || null;

    if (!razorpayOrderId) {
      return NextResponse.json({ ok: true, skipped: 'no-order-id' });
    }

    const admin = createAdminSupabase();
    const { data: existing } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    if (!existing) {
      console.warn('[razorpay webhook] no local order yet', { type, razorpayOrderId, paymentId });
      return NextResponse.json({ ok: true, unmatched: true });
    }

    // Only promote pending → paid when Razorpay says captured AND amount matches.
    const paidAmountPaise = payment ? Number(payment.amount) : null;
    const orderPaise = Math.round(Number(existing.total) * 100);
    const isCaptured = payment?.status === 'captured' || type === 'order.paid';

    if (existing.status === 'pending_payment') {
      if (!isCaptured) {
        return NextResponse.json({
          ok: true,
          orderId: existing.id,
          skipped: 'not_captured',
        });
      }
      if (
        paidAmountPaise != null &&
        Number.isFinite(orderPaise) &&
        paidAmountPaise !== orderPaise
      ) {
        console.error('[razorpay webhook] amount mismatch', {
          paidAmountPaise,
          orderPaise,
          razorpayOrderId,
        });
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      await admin
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (paymentId) {
        const { error: payErr } = await admin.from('payments').insert({
          order_id: existing.id,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          amount: existing.total,
          currency: existing.currency || 'INR',
          status: 'captured',
          raw: payment || {},
          idempotency_key: paymentId,
        });
        if (payErr && !/duplicate|unique|idempotency/i.test(payErr.message || '')) {
          console.error('[razorpay webhook] payment insert', payErr);
        }
      }

      try {
        await sendOrderEmails({
          order: {
            ...existing,
            status: 'paid',
            razorpay_payment_id: paymentId,
            paymentMethod: 'Razorpay',
          },
          items: existing.order_items || [],
          customerName: existing.shipping?.fullName || '',
        });
      } catch (mailErr) {
        console.error('[razorpay webhook] mail', mailErr);
      }
    }

    return NextResponse.json({ ok: true, orderId: existing.id });
  } catch (err) {
    console.error('[razorpay webhook]', err);
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'razorpay-webhook',
    hint: 'Configure this URL in Razorpay Dashboard → Webhooks (payment.captured, order.paid)',
  });
}
