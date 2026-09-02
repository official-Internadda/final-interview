import { NextResponse } from 'next/server';
import { checkLLMHealth } from '@/lib/groq';

export async function GET() {
  const health = await checkLLMHealth();
  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
