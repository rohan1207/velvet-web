import { NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/lib/session';
import { createAdminSupabase } from '@/lib/supabase';
import { allowInsecureTlsIfConfigured } from '@/lib/tls';

/**
 * Live badge count for the Orders nav item.
 * Counts paid orders that still need fulfilment (not shipped / delivered / cancelled).
 * Excludes pending_payment (abandoned / unpaid checkouts).
 */
export async function GET(request) {
  if (!readSessionFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized', count: 0 }, { status: 401 });
  }
  allowInsecureTlsIfConfigured();

  try {
    const db = createAdminSupabase();
    const { count, error } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['paid', 'processing']);

    if (error) throw error;

    return NextResponse.json({
      count: Number(count) || 0,
      statuses: ['paid', 'processing'],
    });
  } catch (err) {
    console.error('[orders/badge]', err);
    return NextResponse.json(
      { error: err.message || 'Could not load badge', count: 0 },
      { status: 500 },
    );
  }
}
