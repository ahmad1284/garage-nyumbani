import { getGarageStore } from './blobs';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export async function verifyAdminToken(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  if (!token) return false;
  try {
    const store = getGarageStore();
    const raw = await store.get(`admin-session:${token}`, { type: 'json' });
    if (!raw) return false;
    const { createdAt } = raw as { createdAt: number };
    return Date.now() - createdAt < SESSION_TTL_MS;
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<string> {
  const token = crypto.randomUUID();
  const store = getGarageStore();
  await store.setJSON(`admin-session:${token}`, { createdAt: Date.now() });
  return token;
}

export async function deleteAdminSession(token: string): Promise<void> {
  const store = getGarageStore();
  await store.delete(`admin-session:${token}`);
}
