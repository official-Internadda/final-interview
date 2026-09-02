import { NextRequest, NextResponse } from 'next/server';
import { getQuestionLogsByAttemptId, updateAttemptStatus, getAttemptById } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { attempt_id, disqualified, fraud_flags = [] } = await req.json();

    if (!attempt_id) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
    }

    const attempt = await getAttemptById(attempt_id);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (disqualified) {
      const updated = await updateAttemptStatus(attempt_id, {
        status: 'disqualified',
        score_percentage: 0,
        fraud_flags,
        completed_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true, status: 'disqualified', attempt: updated });
    }

    const questionLogs = await getQuestionLogsByAttemptId(attempt_id);

    let totalScore = 0;
    let totalMaxScore = 0;

    questionLogs.forEach((log) => {
      totalScore += log.score;
      totalMaxScore += log.max_score || 10;
    });

    const rawPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Apply difficulty scaling factor to ensure 50% bar matches prompt criteria
    const difficulty = attempt.interview?.difficulty || 'medium';
    let finalPercentage = rawPercentage;

    if (difficulty === 'medium') {
      // Medium: stricter curve
      finalPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage * 0.9)));
    } else if (difficulty === 'hard') {
      // Hard: severe expert curve
      finalPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage * 0.8)));
    } else {
      // Easy: generous rounding
      finalPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage)));
    }

    // Qualifying threshold = 50%
    const status = finalPercentage >= 50 ? 'passed' : 'failed';

    const updated = await updateAttemptStatus(attempt_id, {
      status,
      score_percentage: finalPercentage,
      fraud_flags,
      completed_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      status,
      score_percentage: finalPercentage,
      attempt: updated
    });
  } catch (error: any) {
    console.error('API finish interview error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete interview' }, { status: 500 });
  }
}
