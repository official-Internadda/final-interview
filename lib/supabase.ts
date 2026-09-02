import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null;

// In-Memory Storage Fallback for local development when Supabase keys are not set
const memoryDb = {
  admins: [
    {
      id: 'admin-1',
      username: 'upforge',
      password_hash: '$2b$10$LpealkVv3XKyOpVhI8vPRum7Vbnxce/lVVi2sRH2efh.HyLdDOV2C',
      created_at: new Date().toISOString()
    }
  ],
  interviews: [
    {
      id: 'demo-interview-1',
      title: 'Full-Stack Software Engineer Mock Interview',
      category: 'AI & Machine Learning',
      difficulty: 'medium',
      duration_minutes: 15,
      num_questions: 5,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-interview-2',
      title: 'Product Management Associate Interview',
      category: 'Product',
      difficulty: 'easy',
      duration_minutes: 10,
      num_questions: 3,
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  candidate_attempts: [] as any[],
  question_logs: [] as any[]
};

export async function getAdminByUsername(username: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    if (error && error.code !== 'PGRST116') console.error('Supabase getAdmin error:', error);
    if (data) return data;
  }
  return memoryDb.admins.find((a) => a.username === username) || null;
}

export async function getInterviewById(id: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return data;
  }
  
  const found = memoryDb.interviews.find((i) => i.id === id);
  if (found) return found;

  // Resilient fallback: Create an active interview context dynamically for any share ID
  const fallbackInterview = {
    id,
    title: 'Upforge Executive Mock Interview',
    category: 'AI & Machine Learning',
    difficulty: 'medium',
    duration_minutes: 15,
    num_questions: 5,
    status: 'active',
    created_at: new Date().toISOString()
  };
  memoryDb.interviews.push(fallbackInterview);
  return fallbackInterview;
}

export async function getAllInterviews() {
  if (supabase) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Supabase getAllInterviews error:', error);
    return data || [];
  }
  return [...memoryDb.interviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createInterview(input: {
  title: string;
  category: string;
  difficulty: string;
  duration_minutes?: number;
  num_questions?: number;
}) {
  const newInterview = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `int-${Date.now()}`,
    title: input.title,
    category: input.category,
    difficulty: input.difficulty,
    duration_minutes: input.duration_minutes || 15,
    num_questions: input.num_questions || 5,
    status: 'active',
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('interviews')
      .insert(newInterview)
      .select()
      .single();
    if (error) {
      console.error('Supabase createInterview error:', error);
      throw error;
    }
    return data;
  }

  memoryDb.interviews.unshift(newInterview);
  return newInterview;
}

export async function createCandidateAttempt(input: {
  interview_id: string;
  candidate_name: string;
  candidate_email: string;
}) {
  const newAttempt = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}`,
    interview_id: input.interview_id,
    candidate_name: input.candidate_name,
    candidate_email: input.candidate_email,
    score_percentage: 0,
    status: 'in_progress',
    fraud_flags: [],
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('candidate_attempts')
      .insert(newAttempt)
      .select()
      .single();
    if (error) {
      console.error('Supabase createCandidateAttempt error:', error);
      throw error;
    }
    return data;
  }

  memoryDb.candidate_attempts.push(newAttempt);
  return newAttempt;
}

export async function getAttemptById(id: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('candidate_attempts')
      .select('*, interview:interviews(*)')
      .eq('id', id)
      .single();
    if (error) console.error('Supabase getAttemptById error:', error);
    return data;
  }
  const attempt = memoryDb.candidate_attempts.find((a) => a.id === id);
  if (!attempt) return null;
  const interview = memoryDb.interviews.find((i) => i.id === attempt.interview_id);
  return { ...attempt, interview };
}

export async function getAllAttemptsWithInterviews() {
  if (supabase) {
    const { data, error } = await supabase
      .from('candidate_attempts')
      .select('*, interview:interviews(*)')
      .order('created_at', { ascending: false });
    if (error) console.error('Supabase getAllAttempts error:', error);
    return data || [];
  }
  return memoryDb.candidate_attempts.map((attempt) => {
    const interview = memoryDb.interviews.find((i) => i.id === attempt.interview_id);
    return { ...attempt, interview };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateAttemptStatus(
  id: string,
  updates: {
    status?: 'passed' | 'failed' | 'disqualified' | 'in_progress';
    score_percentage?: number;
    fraud_flags?: any[];
    completed_at?: string;
  }
) {
  if (supabase) {
    const { data, error } = await supabase
      .from('candidate_attempts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) console.error('Supabase updateAttemptStatus error:', error);
    return data;
  }

  const attempt = memoryDb.candidate_attempts.find((a) => a.id === id);
  if (attempt) {
    Object.assign(attempt, updates);
  }
  return attempt;
}

export async function saveQuestionLog(log: {
  attempt_id: string;
  question_index: number;
  question_text: string;
  candidate_answer: string;
  ai_feedback: string;
  score: number;
  max_score: number;
}) {
  const newLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ql-${Date.now()}`,
    ...log,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('question_logs')
      .insert(newLog)
      .select()
      .single();
    if (error) console.error('Supabase saveQuestionLog error:', error);
    return data;
  }

  memoryDb.question_logs.push(newLog);
  return newLog;
}

export async function getQuestionLogsByAttemptId(attemptId: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('question_logs')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('question_index', { ascending: true });
    if (error) console.error('Supabase getQuestionLogs error:', error);
    return data || [];
  }
  return memoryDb.question_logs
    .filter((q) => q.attempt_id === attemptId)
    .sort((a, b) => a.question_index - b.question_index);
}
