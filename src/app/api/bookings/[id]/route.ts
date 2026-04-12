import { NextRequest, NextResponse } from 'next/server';
import { getGarageStore } from '@/lib/blobs';
import { verifyAdminToken } from '@/lib/auth';
import type { Booking } from '@/lib/storage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isValid = await verifyAdminToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let updates: Partial<Booking>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const store = getGarageStore();
    const raw = await store.get('bookings', { type: 'json' });
    const bookings: Booking[] = (raw as Booking[] | null) ?? [];

    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updated = { ...bookings[idx], ...updates };
    bookings[idx] = updated;
    await store.setJSON('bookings', bookings);

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
