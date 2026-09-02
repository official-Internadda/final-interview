export type Difficulty = 'easy' | 'medium' | 'hard';
export type AttemptStatus = 'passed' | 'failed' | 'disqualified' | 'in_progress';
export type SessionPhase = 'greeting' | 'smalltalk' | 'briefing' | 'questions' | 'image_round' | 'close';

export interface TranscriptEntry {
  role: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  phase?: SessionPhase;
}

export interface Admin {
  id: string;
  username: string;
  created_at: string;
}

export interface Interview {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  duration_minutes: number;
  num_questions: number;
  status: 'active' | 'archived';
  created_at: string;
}

// Sanitized type for candidate-facing payloads (strips out difficulty)
export interface CandidateInterview {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  num_questions: number;
  status: 'active' | 'archived';
  created_at: string;
}


export interface FraudFlag {
  type: 'tab_switch' | 'no_face' | 'turned_away' | 'multiple_faces';
  message: string;
  timestamp: string;
}

export interface CandidateAttempt {
  id: string;
  interview_id: string;
  candidate_name: string;
  candidate_email: string;
  score_percentage: number;
  status: AttemptStatus;
  fraud_flags: FraudFlag[];
  completed_at?: string;
  created_at: string;
  interview?: Interview;
}

export interface QuestionLog {
  id: string;
  attempt_id: string;
  question_index: number;
  question_text: string;
  candidate_answer?: string;
  ai_feedback?: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface CreateInterviewInput {
  title: string;
  category: string;
  difficulty: Difficulty;
  duration_minutes?: number;
  num_questions?: number;
}

export interface DetailedReport {
  attempt: CandidateAttempt;
  interview: Interview;
  questions: QuestionLog[];
  overall_score: number;
  passed: boolean;
  disqualified: boolean;
  strengths: string[];
  areas_for_improvement: string[];
}
