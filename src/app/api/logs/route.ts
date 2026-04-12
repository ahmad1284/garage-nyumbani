import { NextRequest, NextResponse } from 'next/server';
import { getGarageStore } from '@/lib/blobs';
import { verifyAdminToken } from '@/lib/auth';
import type { WhatsAppLog } from '@/lib/storage';

export async function GET() {
  try {
    const store = getGarageStore();
    const raw = await store.get('logs', { type: 'json' });
    const logs: WhatsAppLog[] = (raw as WhatsAppLog[] | null) ?? [];
    return NextResponse.json(logs, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isValid = await verifyAdminToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { bookingId: string; phone: string; message: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const store = getGarageStore();
    const raw = await store.get('logs', { type: 'json' });
    const logs: WhatsAppLog[] = (raw as WhatsAppLog[] | null) ?? [];

    const newLog: WhatsAppLog = {
      id: crypto.randomUUID(),
      bookingId: body.bookingId,
      phone: body.phone,
      message: body.message,
      sentAt: new Date().toISOString(),
    };

    await store.setJSON('logs', [newLog, ...logs]);
    return NextResponse.json(newLog, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}
