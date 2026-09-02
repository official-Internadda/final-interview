import { NextRequest, NextResponse } from 'next/server';
import { getInterviewById } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const interview = await getInterviewById(id);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // SANITIZE: Delete/strip difficulty from candidate payload!
    const { difficulty, ...candidateInterview } = interview;

    return NextResponse.json({ interview: candidateInterview });
  } catch (error: any) {
    console.error('API GET interview error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
