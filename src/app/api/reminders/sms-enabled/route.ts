import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ enabled: !!process.env.AT_API_KEY }, { status: 200 });
}
