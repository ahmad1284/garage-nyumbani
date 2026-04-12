/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/route';
import { NextRequest } from 'next/server';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  createAdminSession: jest.fn().mockResolvedValue('test-uuid-token'),
}));

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/auth', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('POST /api/auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_PASSWORD: 'secret123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('correct password returns 200 with token', async () => {
    const res = await POST(makeRequest({ password: 'secret123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe('test-uuid-token');
  });

  test('wrong password returns 401', async () => {
    const res = await POST(makeRequest({ password: 'wrongpassword' }));
    expect(res.status).toBe(401);
  });

  test('missing ADMIN_PASSWORD env var returns 503', async () => {
    delete process.env.ADMIN_PASSWORD;
    const res = await POST(makeRequest({ password: 'anything' }));
    expect(res.status).toBe(503);
  });
});
