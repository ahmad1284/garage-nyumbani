/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/bookings/route';
import { PATCH } from '@/app/api/bookings/[id]/route';
import { NextRequest } from 'next/server';
import type { Booking } from '@/lib/storage';

const mockStore = {
  get: jest.fn(),
  setJSON: jest.fn(),
};

jest.mock('@/lib/blobs', () => ({
  getGarageStore: () => mockStore,
}));

jest.mock('@/lib/auth', () => ({
  verifyAdminToken: jest.fn(),
}));

import { verifyAdminToken } from '@/lib/auth';

const BASE_BOOKING: Booking = {
  id: 'abc-123',
  customerName: 'Alice',
  phone: '0711000000',
  carModel: 'Toyota IST',
  serviceType: 'oil-change',
  location: 'Mwanga',
  preferredDate: '2026-04-10',
  preferredTime: '09:00',
  isEmergency: false,
  status: 'New',
  createdAt: '2026-04-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.get.mockResolvedValue(null);
  mockStore.setJSON.mockResolvedValue(undefined);
  (verifyAdminToken as jest.Mock).mockResolvedValue(false);
});

describe('GET /api/bookings', () => {
  test('returns empty array when no bookings in store', async () => {
    const req = new NextRequest('http://localhost/api/bookings');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('returns bookings from store', async () => {
    mockStore.get.mockResolvedValue([BASE_BOOKING]);
    const req = new NextRequest('http://localhost/api/bookings');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('abc-123');
  });

  test('filters by phone query param', async () => {
    const other = { ...BASE_BOOKING, id: 'xyz', phone: '0722000000' };
    mockStore.get.mockResolvedValue([BASE_BOOKING, other]);
    const req = new NextRequest('http://localhost/api/bookings?phone=0711000000');
    const res = await GET(req);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].phone).toBe('0711000000');
  });
});

describe('POST /api/bookings', () => {
  test('creates booking with server-generated id and status New', async () => {
    const { id, status, createdAt, ...payload } = BASE_BOOKING;
    const req = new NextRequest('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('New');
    expect(body.id).toBeTruthy();
    expect(body.id).not.toBe(id); // server-generated
  });

  test('returns 400 on missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ customerName: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/bookings/[id]', () => {
  test('returns 401 without auth token', async () => {
    const req = new NextRequest('http://localhost/api/bookings/abc-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'In Progress' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc-123' }) });
    expect(res.status).toBe(401);
  });

  test('updates booking when authenticated', async () => {
    (verifyAdminToken as jest.Mock).mockResolvedValue(true);
    mockStore.get.mockResolvedValue([BASE_BOOKING]);

    const req = new NextRequest('http://localhost/api/bookings/abc-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'In Progress', mechanic: 'John' }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc-123' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('In Progress');
    expect(body.mechanic).toBe('John');
  });

  test('returns 404 when booking not found', async () => {
    (verifyAdminToken as jest.Mock).mockResolvedValue(true);
    mockStore.get.mockResolvedValue([BASE_BOOKING]);

    const req = new NextRequest('http://localhost/api/bookings/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
