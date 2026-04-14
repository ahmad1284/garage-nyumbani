import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { getGarageStore } from '@/lib/blobs';
import type { WhatsAppLog } from '@/lib/storage';

interface ReminderTarget {
  id: string;
  phone: string;
  customerName: string;
  carModel: string;
  serviceType: string;
}

export async function POST(request: NextRequest) {
  const isValid = await verifyAdminToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME ?? 'sandbox';

  if (!apiKey) {
    return NextResponse.json({ error: 'SMS not configured' }, { status: 503 });
  }

  let body: { targets: ReminderTarget[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { targets } = body;
  if (!Array.isArray(targets) || targets.length === 0) {
    return NextResponse.json({ error: 'No targets provided' }, { status: 400 });
  }

  const store = getGarageStore();
  const raw = await store.get('logs', { type: 'json' });
  const logs: WhatsAppLog[] = (raw as WhatsAppLog[] | null) ?? [];
  const newLogs: WhatsAppLog[] = [];
  const results: { phone: string; success: boolean; error?: string }[] = [];

  for (const target of targets) {
    const message = `Hello ${target.customerName}, it's time for your next ${target.serviceType} service for your ${target.carModel}. Please book an appointment with Garage Nyumbani!`;

    try {
      const params = new URLSearchParams({
        username,
        to: target.phone,
        message,
      });

      const res = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const success = res.ok;
      results.push({ phone: target.phone, success });

      const newLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        bookingId: target.id,
        phone: target.phone,
        message,
        sentAt: new Date().toISOString(),
        type: 'reminder',
      };
      newLogs.push(newLog);
    } catch (err) {
      results.push({ phone: target.phone, success: false, error: String(err) });
    }
  }

  if (newLogs.length > 0) {
    await store.setJSON('logs', [...newLogs, ...logs]);
  }

  return NextResponse.json({ results }, { status: 200 });
}
