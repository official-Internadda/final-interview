import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { TranscriptEntry, SessionPhase, Difficulty } from './types';

// Primary LLM Provider: Groq
const groqApiKey = process.env.GROQ_API_KEY || '';
export const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
export const GROQ_MODEL_VERSATILE = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Secondary Fallback LLM Provider: Google Gemini
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
export const gemini = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export interface ConversationalTurnOutput {
  nextMessage: string;
  phase: SessionPhase;
  moveOn: boolean;
  rejectedAnswer?: boolean;
  showImage?: boolean;
  imageUrl?: string;
  context_hint?: string;
  provider?: 'groq' | 'gemini' | 'static_fallback';
  errorDetails?: string;
}

export interface EvaluationOutput {
  score: number;
  max_score: number;
  feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  provider?: 'groq' | 'gemini' | 'static_fallback';
  errorDetails?: string;
}

// Curated high quality work-appropriate stock images for mid-interview observational curveball
export const fontStockImages: string[] = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', // Team collaboration whiteboard
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80', // Design review / user testing
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80', // Data dashboard analysis
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'  // Mission control room
];

export function getRandomStockImage(): string {
  const idx = Math.floor(Math.random() * fontStockImages.length);
  return fontStockImages[idx];
}

/**
 * Defensive normalized string similarity (Jaccard token similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const tokens1 = new Set(str1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));
  const tokens2 = new Set(str2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach((t) => {
    if (tokens2.has(t)) intersection++;
  });

  const union = tokens1.size + tokens2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Clean LLM JSON output string before parsing
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Generate Next Conversational Turn with Primary (Groq) -> Fallback (Gemini) -> Static Last Resort
 */
export async function generateConversationalTurn(params: {
  category: string;
  difficulty: Difficulty;
  currentPhase: SessionPhase;
  transcript: TranscriptEntry[];
  questionTurnCount: number;
  totalQuestions: number;
  imageUrl?: string;
}): Promise<ConversationalTurnOutput> {
  const { category, difficulty, currentPhase, transcript, questionTurnCount, totalQuestions, imageUrl } = params;

  const lastCandidateEntry = [...transcript].reverse().find((t) => t.role === 'candidate');
  const candidateText = lastCandidateEntry ? lastCandidateEntry.text.trim() : '';
  const wordCount = candidateText ? candidateText.split(/\s+/).filter(Boolean).length : 0;

  // Rule: Check for low-content short answers during question or image phases
  if (
    (currentPhase === 'questions' || currentPhase === 'image_round') &&
    transcript.length > 0 &&
    lastCandidateEntry &&
    wordCount < 12
  ) {
    return {
      nextMessage: "Could you expand on that a bit more? Walk me through your specific thinking and approach.",
      phase: currentPhase,
      moveOn: false,
      rejectedAnswer: true,
      context_hint: "Response was too brief. Require detailed elaboration.",
      provider: 'groq'
    };
  }

  // Format transcript for LLM context
  const formattedTranscript = transcript
    .map((t) => `${t.role === 'ai' ? 'AI Interviewer' : 'Candidate'}: "${t.text}"`)
    .join('\n');

  const isHardMode = difficulty === 'hard';

  const systemPrompt = `You are AI Interviewer, Europe's sharp, warm, and highly objective talent evaluation agent.
Domain Category: ${category}
Difficulty Standard: ${difficulty.toUpperCase()}
Session Phase: ${currentPhase}
Questions Answered So Far: ${questionTurnCount} / ${totalQuestions}

Tone & Persona:
- Warm, natural, sharp human interviewer speaking live in a video call.
- Use natural conversational bridges ("Got it, that makes sense", "Interesting point about X", "Quick follow-up on that...").
- NEVER read a robotic question list. React directly to what the candidate just said.

Phase Rules:
1. GREETING: Warm human welcome ("Hey! Thanks for joining today — how are you feeling? Ready to get started?").
2. SMALLTALK: Acknowledge candidate's warm-up reply, give a brief privacy/proctoring reminder, and transition to briefing.
3. BRIEFING: Transition smoothly into the first domain question for ${category}.
4. QUESTIONS:
   - Ask deep follow-up questions if candidate's response needs clarification.
   - ${isHardMode ? 'HARD MODE: Challenge assumptions ruthlessly, demand concrete performance metrics, exact scaling strategies, and architectural trade-offs.' : 'Focus on STAR structure, practical experience, and sound decision making.'}
   - If candidate answered sufficiently, set moveOn = true and ask the next core question in ${category}.
5. IMAGE_ROUND: If questionTurnCount reaches 2 or 3 and image_round hasn't happened yet, transition casually ("Let's do something a little different...") and present a visual curveball.
6. CLOSE: Wrap up warmly when questions are complete.

DEDUPLICATION MANDATE:
Do NOT generate a line near-identical to any previous AI statement in the transcript.

Return ONLY valid JSON matching this schema:
{
  "nextMessage": "<Your spoken response>",
  "phase": "<greeting | smalltalk | briefing | questions | image_round | close>",
  "moveOn": <true if moving to new topic/phase, false if asking immediate follow-up>,
  "showImage": <true if triggering image round>,
  "context_hint": "<1-line hint for evaluator guidance>"
}`;

  let groqErrorDetails: string | undefined;

  // -------------------------------------------------------------
  // ATTEMPT 1: Primary LLM Provider — Groq
  // -------------------------------------------------------------
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current Transcript:\n${formattedTranscript || '(Beginning of interview session)'}` }
        ],
        model: GROQ_MODEL_VERSATILE,
        response_format: { type: 'json_object' },
        temperature: isHardMode ? 0.6 : 0.7,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(cleanJsonResponse(content));

      let nextMsg = parsed.nextMessage || `Let's discuss your practical experience in ${category}. Could you walk me through a major project you led?`;
      let nextPhase: SessionPhase = parsed.phase || currentPhase;
      let moveOn: boolean = Boolean(parsed.moveOn);
      let showImg: boolean = Boolean(parsed.showImage);

      // Defensive Deduplication Check
      const previousAiLines = transcript.filter((t) => t.role === 'ai').map((t) => t.text);
      for (const prevLine of previousAiLines) {
        const similarity = calculateSimilarity(nextMsg, prevLine);
        if (similarity > 0.7) {
          console.warn(`[AI Deduplication] High similarity detected (${(similarity * 100).toFixed(1)}%). Forcing fresh topic generation.`);
          moveOn = true;
          nextMsg = `Building on that perspective, how do you approach performance monitoring and scaling under heavy load in ${category}?`;
          break;
        }
      }

      let imgUrl: string | undefined = undefined;
      if (showImg || nextPhase === 'image_round') {
        imgUrl = imageUrl || getRandomStockImage();
        showImg = true;
        nextPhase = 'image_round';
      }

      return {
        nextMessage: nextMsg,
        phase: nextPhase,
        moveOn,
        showImage: showImg,
        imageUrl: imgUrl,
        context_hint: parsed.context_hint || 'Evaluate domain depth and structure.',
        provider: 'groq'
      };
    } catch (error: any) {
      groqErrorDetails = `[Groq Model: ${GROQ_MODEL_VERSATILE}] ${error.status || error.name || 'Error'}: ${error.message || String(error)}`;
      console.error('[Groq generateConversationalTurn failed]', groqErrorDetails);
    }
  } else {
    groqErrorDetails = `[Groq] GROQ_API_KEY is missing or empty.`;
    console.warn(groqErrorDetails);
  }

  // -------------------------------------------------------------
  // ATTEMPT 2: Secondary Fallback Provider — Google Gemini
  // -------------------------------------------------------------
  let geminiErrorDetails: string | undefined;
  if (gemini) {
    try {
      console.warn('[Fallback] Retrying generateConversationalTurn via Gemini...');
      const geminiRes = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Current Transcript:\n${formattedTranscript || '(Beginning of interview session)'}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: isHardMode ? 0.6 : 0.7,
          maxOutputTokens: 800
        }
      });

      const content = geminiRes.text || '{}';
      const parsed = JSON.parse(cleanJsonResponse(content));

      let nextMsg = parsed.nextMessage || `Let's discuss your practical experience in ${category}. Could you walk me through a major project you led?`;
      let nextPhase: SessionPhase = parsed.phase || currentPhase;
      let moveOn: boolean = Boolean(parsed.moveOn);
      let showImg: boolean = Boolean(parsed.showImage);

      // Defensive Deduplication Check
      const previousAiLines = transcript.filter((t) => t.role === 'ai').map((t) => t.text);
      for (const prevLine of previousAiLines) {
        const similarity = calculateSimilarity(nextMsg, prevLine);
        if (similarity > 0.7) {
          console.warn(`[AI Deduplication] High similarity detected (${(similarity * 100).toFixed(1)}%). Forcing fresh topic generation.`);
          moveOn = true;
          nextMsg = `Building on that perspective, how do you approach performance monitoring and scaling under heavy load in ${category}?`;
          break;
        }
      }

      let imgUrl: string | undefined = undefined;
      if (showImg || nextPhase === 'image_round') {
        imgUrl = imageUrl || getRandomStockImage();
        showImg = true;
        nextPhase = 'image_round';
      }

      return {
        nextMessage: nextMsg,
        phase: nextPhase,
        moveOn,
        showImage: showImg,
        imageUrl: imgUrl,
        context_hint: parsed.context_hint || 'Evaluate domain depth and structure.',
        provider: 'gemini',
        errorDetails: groqErrorDetails
      };
    } catch (error: any) {
      geminiErrorDetails = `[Gemini Model: ${GEMINI_MODEL}] ${error.status || error.name || 'Error'}: ${error.message || String(error)}`;
      console.error('[Gemini generateConversationalTurn failed]', geminiErrorDetails);
    }
  } else {
    geminiErrorDetails = `[Gemini] GEMINI_API_KEY is missing or empty.`;
  }

  // -------------------------------------------------------------
  // ATTEMPT 3: Absolute Last Resort Static Fallback
  // Generic message so candidate knows system is reconnecting, not a real question
  // -------------------------------------------------------------
  const combinedError = [groqErrorDetails, geminiErrorDetails].filter(Boolean).join(' | ');

  return {
    nextMessage: "I'm having a brief technical moment, one second...",
    phase: currentPhase,
    moveOn: false,
    provider: 'static_fallback',
    errorDetails: combinedError
  };
}

/**
 * Evaluate Candidate Answer against Domain Rubric (Primary Groq -> Fallback Gemini -> Static)
 */
export async function evaluateAnswer(params: {
  category: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
}): Promise<EvaluationOutput> {
  const { category, difficulty, question, answer } = params;

  const systemPrompt = `You are AI Interviewer, Europe's objective corporate talent evaluation engine.
Domain Category: ${category}
Difficulty Standard: ${difficulty.toUpperCase()}

Question: "${question}"
Candidate Response: "${answer}"

Output ONLY valid JSON:
{
  "score": <number between 0 and 10>,
  "feedback": "<2-3 sentence executive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areas_for_improvement": ["<area 1>", "<area 2>"]
}`;

  let groqErrorDetails: string | undefined;

  // -------------------------------------------------------------
  // ATTEMPT 1: Groq Primary
  // -------------------------------------------------------------
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Evaluate response.' }
        ],
        model: GROQ_MODEL_VERSATILE,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(cleanJsonResponse(content));
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 6,
        max_score: 10,
        feedback: parsed.feedback || 'Evaluated against category standards.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear domain communication'],
        areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : ['Include measurable outcomes'],
        provider: 'groq'
      };
    } catch (error: any) {
      groqErrorDetails = `[Groq Model: ${GROQ_MODEL_VERSATILE}] ${error.status || error.name || 'Error'}: ${error.message || String(error)}`;
      console.error('[Groq evaluateAnswer failed]', groqErrorDetails);
    }
  } else {
    groqErrorDetails = `[Groq] GROQ_API_KEY missing.`;
  }

  // -------------------------------------------------------------
  // ATTEMPT 2: Gemini Fallback
  // -------------------------------------------------------------
  let geminiErrorDetails: string | undefined;
  if (gemini) {
    try {
      console.warn('[Fallback] Retrying evaluateAnswer via Gemini...');
      const geminiRes = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: 'Evaluate response.',
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 800
        }
      });

      const content = geminiRes.text || '{}';
      const parsed = JSON.parse(cleanJsonResponse(content));
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 6,
        max_score: 10,
        feedback: parsed.feedback || 'Evaluated against category standards.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear domain communication'],
        areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : ['Include measurable outcomes'],
        provider: 'gemini',
        errorDetails: groqErrorDetails
      };
    } catch (error: any) {
      geminiErrorDetails = `[Gemini Model: ${GEMINI_MODEL}] ${error.status || error.name || 'Error'}: ${error.message || String(error)}`;
      console.error('[Gemini evaluateAnswer failed]', geminiErrorDetails);
    }
  } else {
    geminiErrorDetails = `[Gemini] GEMINI_API_KEY missing.`;
  }

  // -------------------------------------------------------------
  // ATTEMPT 3: Static Fallback
  // -------------------------------------------------------------
  const wordCount = answer ? answer.trim().split(/\s+/).length : 0;
  let baseScore = Math.min(10, Math.max(3, Math.floor(wordCount / 10)));
  if (difficulty === 'medium') baseScore = Math.max(1, baseScore - 1);
  if (difficulty === 'hard') baseScore = Math.max(1, baseScore - 2);

  const combinedError = [groqErrorDetails, geminiErrorDetails].filter(Boolean).join(' | ');

  return {
    score: baseScore,
    max_score: 10,
    feedback: wordCount > 25 ? 'Structured response addressing core prompt.' : 'Response was brief. Focus on STAR method details.',
    strengths: ['Addressed core topic'],
    areas_for_improvement: ['Include quantifiable metrics'],
    provider: 'static_fallback',
    errorDetails: combinedError
  };
}

/**
 * Uptime / Health Check Helper for LLMs
 */
export async function checkLLMHealth(): Promise<{
  status: 'ok' | 'degraded' | 'error';
  groq: { ok: boolean; model: string; error?: string };
  gemini: { ok: boolean; model: string; error?: string };
}> {
  let groqOk = false;
  let groqError: string | undefined;

  if (groq) {
    try {
      await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Reply OK' }],
        model: GROQ_MODEL_VERSATILE,
        max_tokens: 5
      });
      groqOk = true;
    } catch (err: any) {
      groqError = `[Groq ${GROQ_MODEL_VERSATILE}] ${err.status || err.name || 'Error'}: ${err.message}`;
      console.warn(`[SERVER HEALTH CHECK WARNING] Groq model "${GROQ_MODEL_VERSATILE}" failed health check:`, err.message);
    }
  } else {
    groqError = 'GROQ_API_KEY is not configured';
    console.warn('[SERVER HEALTH CHECK WARNING] GROQ_API_KEY is not set');
  }

  let geminiOk = false;
  let geminiError: string | undefined;

  if (gemini) {
    try {
      await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: 'Reply OK'
      });
      geminiOk = true;
    } catch (err: any) {
      geminiError = `[Gemini ${GEMINI_MODEL}] ${err.status || err.name || 'Error'}: ${err.message}`;
      console.warn(`[SERVER HEALTH CHECK WARNING] Gemini model "${GEMINI_MODEL}" failed health check:`, err.message);
    }
  } else {
    geminiError = 'GEMINI_API_KEY is not configured';
  }

  const status = groqOk ? 'ok' : geminiOk ? 'degraded' : 'error';
  return {
    status,
    groq: { ok: groqOk, model: GROQ_MODEL_VERSATILE, error: groqError },
    gemini: { ok: geminiOk, model: GEMINI_MODEL, error: geminiError }
  };
}
