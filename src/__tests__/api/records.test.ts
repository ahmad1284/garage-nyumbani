/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/records/route';
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

const BASE_RECORD = {
  phone: '0711000000',
  customerName: 'Bob',
  carModel: 'Nissan Note',
  serviceType: 'oil-change',
  serviceDate: new Date().toISOString(),
  nextServiceDate: new Date().toISOString(),
  notes: 'Test',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.get.mockResolvedValue(null);
  mockStore.setJSON.mockResolvedValue(undefined);
  (verifyAdminToken as jest.Mock).mockResolvedValue(false);
});

describe('GET /api/records', () => {
  test('returns empty array when store is empty', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('returns records from store', async () => {
    mockStore.get.mockResolvedValue([{ ...BASE_RECORD, id: 'r1' }]);
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('r1');
  });
});

describe('POST /api/records', () => {
  test('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/records', {
      method: 'POST',
      body: JSON.stringify(BASE_RECORD),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('creates record with server-generated id when authenticated', async () => {
    (verifyAdminToken as jest.Mock).mockResolvedValue(true);
    const req = new NextRequest('http://localhost/api/records', {
      method: 'POST',
      body: JSON.stringify(BASE_RECORD),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.customerName).toBe('Bob');
  });
});
