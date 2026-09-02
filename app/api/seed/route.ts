import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      message: 'Supabase credentials not configured in environment. Using in-memory store.',
      isSupabaseConfigured: false
    });
  }

  try {
    const password_hash = await hashPassword('Upforge@24/7');

    // Seed Admin
    const { error: adminError } = await supabase
      .from('admins')
      .upsert({ username: 'upforge', password_hash }, { onConflict: 'username' });

    if (adminError) console.error('Seed Admin error:', adminError);

    // Seed Sample Interview
    const { data: sampleInterview, error: interviewError } = await supabase
      .from('interviews')
      .insert({
        title: 'Full-Stack Software Engineer Mock Interview',
        category: 'AI & Machine Learning',
        difficulty: 'medium',
        duration_minutes: 15,
        num_questions: 5,
        status: 'active'
      })
      .select()
      .single();

    if (interviewError) console.error('Seed Interview error:', interviewError);

    return NextResponse.json({
      success: true,
      message: 'Supabase seeded successfully with default admin (admin / admin123)',
      sampleInterview
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
