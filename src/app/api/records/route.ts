import { NextRequest, NextResponse } from 'next/server';
import { getGarageStore } from '@/lib/blobs';
import { verifyAdminToken } from '@/lib/auth';
import type { ServiceRecord } from '@/lib/storage';

export async function GET() {
  try {
    const store = getGarageStore();
    const raw = await store.get('records', { type: 'json' });
    const records: ServiceRecord[] = (raw as ServiceRecord[] | null) ?? [];
    return NextResponse.json(records, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isValid = await verifyAdminToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Omit<ServiceRecord, 'id'>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.phone || !body.customerName || !body.carModel) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const store = getGarageStore();
    const raw = await store.get('records', { type: 'json' });
    const records: ServiceRecord[] = (raw as ServiceRecord[] | null) ?? [];

    const newRecord: ServiceRecord = {
      ...body,
      id: crypto.randomUUID(),
    };

    await store.setJSON('records', [newRecord, ...records]);
    return NextResponse.json(newRecord, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}
