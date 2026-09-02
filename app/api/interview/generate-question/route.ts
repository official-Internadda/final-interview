import { NextRequest, NextResponse } from 'next/server';
import { generateConversationalTurn } from '@/lib/groq';
import { getInterviewById } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const {
      interview_id,
      category,
      difficulty: requestedDifficulty,
      currentPhase,
      transcript,
      questionTurnCount,
      totalQuestions,
      imageUrl
    } = await req.json();

    // Look up difficulty securely from DB if interview_id is provided, else fallback to param or 'medium'
    let actualDifficulty = requestedDifficulty || 'medium';
    if (interview_id) {
      const dbInterview = await getInterviewById(interview_id);
      if (dbInterview) {
        actualDifficulty = dbInterview.difficulty;
      }
    }

    const turnOutput = await generateConversationalTurn({
      category: category || 'Software Engineering',
      difficulty: actualDifficulty,
      currentPhase: currentPhase || 'greeting',
      transcript: transcript || [],
      questionTurnCount: questionTurnCount || 0,
      totalQuestions: totalQuestions || 5,
      imageUrl
    });

    // Ensure output returned to candidate DOES NOT include difficulty
    return NextResponse.json({ success: true, ...turnOutput });
  } catch (error: any) {
    console.error('API generate-question error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate conversational turn' }, { status: 500 });
  }
}
