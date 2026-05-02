import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.APP_PASSWORD || '';

export async function GET(req: NextRequest) {
  if (!PASSWORD) return NextResponse.json({ ok: true });
  const auth = req.headers.get('x-app-password');
  if (auth === PASSWORD) return NextResponse.json({ ok: true });
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
