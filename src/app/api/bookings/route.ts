import { NextRequest, NextResponse } from 'next/server';
import { getGarageStore } from '@/lib/blobs';
import type { Booking } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const store = getGarageStore();
    const raw = await store.get('bookings', { type: 'json' });
    let bookings: Booking[] = (raw as Booking[] | null) ?? [];

    const phone = request.nextUrl.searchParams.get('phone');
    if (phone) {
      bookings = bookings.filter(b => b.phone === phone);
    }

    return NextResponse.json(bookings, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Omit<Booking, 'id' | 'status' | 'createdAt'>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.customerName || !body.phone || !body.carModel || !body.serviceType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const store = getGarageStore();
    const raw = await store.get('bookings', { type: 'json' });
    const bookings: Booking[] = (raw as Booking[] | null) ?? [];

    const newBooking: Booking = {
      ...body,
      id: `GN-${String(bookings.length + 1).padStart(6, '0')}`,
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    await store.setJSON('bookings', [newBooking, ...bookings]);
    return NextResponse.json(newBooking, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 });
  }
}
