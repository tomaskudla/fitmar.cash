import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.APP_PASSWORD || '';

function checkAuth(req: NextRequest): boolean {
  if (!PASSWORD) return true;
  const auth = req.headers.get('x-app-password');
  return auth === PASSWORD;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { key } = await params;
  try {
    const value = await kv.get(key);
    return NextResponse.json({ value });
  } catch (e) {
    return NextResponse.json({ value: null });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { key } = await params;
  try {
    const body = await req.json();
    await kv.set(key, body.value);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { key } = await params;
  try {
    await kv.del(key);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
