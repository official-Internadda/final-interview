import { NextRequest, NextResponse } from 'next/server';
import { getAllInterviews, createInterview, getAllAttemptsWithInterviews } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviews = await getAllInterviews();
    const attempts = await getAllAttemptsWithInterviews();

    return NextResponse.json({ interviews, attempts });
  } catch (error: any) {
    console.error('API GET interviews error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, difficulty, duration_minutes, num_questions } = body;

    if (!title || !category || !difficulty) {
      return NextResponse.json({ error: 'Title, category, and difficulty are required' }, { status: 400 });
    }

    const interview = await createInterview({
      title,
      category,
      difficulty,
      duration_minutes: duration_minutes ? parseInt(duration_minutes, 10) : 15,
      num_questions: num_questions ? parseInt(num_questions, 10) : 5
    });

    return NextResponse.json({ success: true, interview });
  } catch (error: any) {
    console.error('API POST interview error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
