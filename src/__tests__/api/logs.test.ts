/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/logs/route';
import { NextRequest } from 'next/server';

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

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.get.mockResolvedValue(null);
  mockStore.setJSON.mockResolvedValue(undefined);
  (verifyAdminToken as jest.Mock).mockResolvedValue(false);
});

describe('GET /api/logs', () => {
  test('returns empty array when store is empty', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('returns logs from store', async () => {
    const log = { id: 'l1', bookingId: 'b1', phone: '0700', message: 'Hi', sentAt: new Date().toISOString() };
    mockStore.get.mockResolvedValue([log]);
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('l1');
  });
});

describe('POST /api/logs', () => {
  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/logs', {
      method: 'POST',
      body: JSON.stringify({ bookingId: 'b1', phone: '0700', message: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('appends log when authenticated', async () => {
    (verifyAdminToken as jest.Mock).mockResolvedValue(true);
    const req = new NextRequest('http://localhost/api/logs', {
      method: 'POST',
      body: JSON.stringify({ bookingId: 'b1', phone: '0711000000', message: 'Hello!' }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe('Hello!');
    expect(body.id).toBeTruthy();
  });
});
