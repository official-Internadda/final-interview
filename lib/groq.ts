import Groq from 'groq-sdk';
import { TranscriptEntry, SessionPhase, Difficulty } from './types';

const apiKey = process.env.GROQ_API_KEY || '';

export const groq = apiKey ? new Groq({ apiKey }) : null;

export const GROQ_MODEL_VERSATILE = 'llama-3.3-70b-versatile';

export interface ConversationalTurnOutput {
  nextMessage: string;
  phase: SessionPhase;
  moveOn: boolean;
  rejectedAnswer?: boolean;
  showImage?: boolean;
  imageUrl?: string;
  context_hint?: string;
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
 * Generate Next Conversational Turn with Transcript Context & Deduplication
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
      context_hint: "Response was too brief. Require detailed elaboration."
    };
  }

  if (!groq) {
    // Offline / fallback phase-based conversational engine
    if (currentPhase === 'greeting') {
      return {
        nextMessage: "Hey! Thanks for joining today — how are you feeling? Ready to get started?",
        phase: 'smalltalk',
        moveOn: false
      };
    }
    if (currentPhase === 'smalltalk') {
      return {
        nextMessage: "Glad to hear! Before we jump into technical topics, a quick reminder: our session uses live camera and mic monitoring with zero media storage. Shall we begin?",
        phase: 'briefing',
        moveOn: true
      };
    }
    if (currentPhase === 'briefing') {
      return {
        nextMessage: `Awesome. Let's dive right into ${category}. To start, could you walk me through a major challenge or architecture decision you led recently?`,
        phase: 'questions',
        moveOn: true,
        context_hint: 'Looking for candidate project background & STAR structure.'
      };
    }
    if (currentPhase === 'questions' && questionTurnCount >= 2 && !imageUrl) {
      const selectedImg = getRandomStockImage();
      return {
        nextMessage: "Let's try something a little different! I've placed an image on your screen. Take a look and describe what you see, what's happening, and what you'd infer from it.",
        phase: 'image_round',
        moveOn: true,
        showImage: true,
        imageUrl: selectedImg,
        context_hint: 'Observational analysis and communication round.'
      };
    }
    if (currentPhase === 'image_round') {
      return {
        nextMessage: "Great observation! Now returning to our technical dialogue: how do you approach risk mitigation and monitoring when deploying critical updates?",
        phase: 'questions',
        moveOn: true,
        showImage: false
      };
    }
    if (questionTurnCount >= totalQuestions) {
      return {
        nextMessage: "That wraps up our key topics for today! Thank you so much for your time and thoughtful responses. We're finalizing your evaluation report now.",
        phase: 'close',
        moveOn: true
      };
    }

    return {
      nextMessage: `Got it, that's a solid approach. Building on what you said, how do you handle unexpected trade-offs or constraints in ${category}?`,
      phase: 'questions',
      moveOn: true
    };
  }

  // Format transcript for LLM context
  const formattedTranscript = transcript
    .map((t) => `${t.role === 'ai' ? 'AI Interviewer' : 'Candidate'}: "${t.text}"`)
    .join('\n');

  const isHardMode = difficulty === 'hard';

  const systemPrompt = `You are AI Interviewer, Europe's sharp, warm, and highly objective talent evaluation agent.
Domain Category: ${category}
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
   - ${isHardMode ? 'HARD MODE: Challenge assumptions, demand concrete metrics and architectural trade-offs.' : 'Focus on STAR structure and practical experience.'}
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

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Current Transcript:\n${formattedTranscript || '(Beginning of interview session)'}` }
      ],
      model: GROQ_MODEL_VERSATILE,
      response_format: { type: 'json_object' },
      temperature: isHardMode ? 0.6 : 0.7,
      max_tokens: 350
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

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
      context_hint: parsed.context_hint || 'Evaluate domain depth and structure.'
    };
  } catch (error) {
    console.error('Groq generateConversationalTurn error:', error);
    return {
      nextMessage: `Could you share a concrete scenario in ${category} where you had to make a high-stakes technical decision?`,
      phase: currentPhase === 'greeting' || currentPhase === 'smalltalk' ? 'questions' : currentPhase,
      moveOn: true
    };
  }
}

/**
 * Evaluate Candidate Answer against Domain Rubric (Backend only)
 */
export async function evaluateAnswer(params: {
  category: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
}) {
  const { category, difficulty, question, answer } = params;

  if (!groq) {
    const wordCount = answer ? answer.trim().split(/\s+/).length : 0;
    let baseScore = Math.min(10, Math.max(3, Math.floor(wordCount / 10)));
    if (difficulty === 'medium') baseScore = Math.max(1, baseScore - 1);
    if (difficulty === 'hard') baseScore = Math.max(1, baseScore - 2);

    return {
      score: baseScore,
      max_score: 10,
      feedback: wordCount > 25 ? 'Structured response addressing core prompt.' : 'Response was brief. Focus on STAR method details.',
      strengths: ['Addressed core topic'],
      areas_for_improvement: ['Include quantifiable metrics']
    };
  }

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

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluate response.' }
      ],
      model: GROQ_MODEL_VERSATILE,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 6,
      max_score: 10,
      feedback: parsed.feedback || 'Evaluated against category standards.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear domain communication'],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : ['Include measurable outcomes']
    };
  } catch (error) {
    console.error('Groq evaluateAnswer error:', error);
    return {
      score: 6,
      max_score: 10,
      feedback: 'Response evaluated against category standard.',
      strengths: ['Direct response'],
      areas_for_improvement: ['Elaborate further']
    };
  }
}
