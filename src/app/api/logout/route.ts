import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, deleteAdminSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const isValid = await verifyAdminToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = request.headers.get('Authorization')!.slice(7);
  try {
    await deleteAdminSession(token);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
