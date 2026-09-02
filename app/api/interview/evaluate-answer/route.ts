import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/groq';
import { saveQuestionLog, getAttemptById, getInterviewById } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { attempt_id, questionIndex, question_text, candidate_answer, category, difficulty: reqDifficulty } = await req.json();

    if (!attempt_id || !question_text) {
      return NextResponse.json({ error: 'Missing evaluation parameters' }, { status: 400 });
    }

    // Securely retrieve difficulty from DB attempt if available
    let actualDifficulty = reqDifficulty || 'medium';
    let actualCategory = category || 'Software Engineering';

    if (attempt_id) {
      const attempt = await getAttemptById(attempt_id);
      if (attempt && attempt.interview) {
        actualDifficulty = attempt.interview.difficulty;
        actualCategory = attempt.interview.category;
      }
    }

    const evaluation = await evaluateAnswer({
      category: actualCategory,
      difficulty: actualDifficulty,
      question: question_text,
      answer: candidate_answer || '(No answer provided)'
    });

    const savedLog = await saveQuestionLog({
      attempt_id,
      question_index: questionIndex || 1,
      question_text,
      candidate_answer: candidate_answer || '(No answer provided)',
      ai_feedback: evaluation.feedback,
      score: evaluation.score,
      max_score: evaluation.max_score
    });

    return NextResponse.json({
      success: true,
      evaluation,
      log: savedLog
    });
  } catch (error: any) {
    console.error('API evaluate-answer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to evaluate answer' }, { status: 500 });
  }
}
