import { NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/lib/session';
import { allowInsecureTlsIfConfigured } from '@/lib/tls';
import { getCompleteLook, saveCompleteLook } from '@/lib/complete-look';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request) {
  if (!readSessionFromRequest(request)) return unauthorized();
  allowInsecureTlsIfConfigured();
  try {
    const data = await getCompleteLook();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[complete-look GET]', err);
    return NextResponse.json(
      { error: err.message || 'Could not load complete look' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  if (!readSessionFromRequest(request)) return unauthorized();
  allowInsecureTlsIfConfigured();
  try {
    const body = await request.json().catch(() => ({}));
    const data = await saveCompleteLook(body);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[complete-look PUT]', err);
    return NextResponse.json(
      { error: err.message || 'Could not save complete look' },
      { status: err.status || 500 },
    );
  }
}
