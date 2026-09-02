import { NextRequest, NextResponse } from 'next/server';
import { createCandidateAttempt, getInterviewById } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { interview_id, candidate_name, candidate_email } = await req.json();

    if (!interview_id || !candidate_name || !candidate_email) {
      return NextResponse.json({ error: 'Missing required candidate information' }, { status: 400 });
    }

    const interview = await getInterviewById(interview_id);
    if (!interview) {
      return NextResponse.json({ error: 'Interview does not exist' }, { status: 404 });
    }

    const attempt = await createCandidateAttempt({
      interview_id,
      candidate_name,
      candidate_email
    });

    // SANITIZE: Remove difficulty from interview object sent to candidate
    const { difficulty, ...candidateInterview } = interview;

    return NextResponse.json({
      success: true,
      attempt,
      interview: candidateInterview
    });
  } catch (error: any) {
    console.error('API interview start error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start interview session' }, { status: 500 });
  }
}
