'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ShieldCheck,
  Radio,
  Video,
  AlertTriangle,
  Lock,
  X,
  Bug,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { Interview, CandidateAttempt, FraudFlag, TranscriptEntry, SessionPhase } from '@/lib/types';
import { ProctoringMonitor } from './proctoring-monitor';

interface LiveInterviewProps {
  interview: Interview;
  attempt: CandidateAttempt;
  mediaStream: MediaStream | null;
  onFinish: (disqualified?: boolean, flags?: FraudFlag[]) => void;
}

type VoiceState = 'idle' | 'ai_speaking' | 'listening' | 'processing';

export function LiveInterview({
  interview,
  attempt,
  mediaStream,
  onFinish
}: LiveInterviewProps) {
  // Session State
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>('greeting');
  const [questionTurnCount, setQuestionTurnCount] = useState(0);
  const [aiMessage, setAiMessage] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Transcript History
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);

  // Dev Debug Panel
  const [showDebug, setShowDebug] = useState(false);

  // Soft Overall Session Timer (Total session duration, e.g. 15 mins)
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(interview.duration_minutes * 60);

  // Loading / Processing State
  const [loadingTurn, setLoadingTurn] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const voiceStateRef = useRef<VoiceState>('idle');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync ref with state
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Attach webcam stream to video element
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Keyboard shortcut Ctrl+Shift+D for dev debug panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Soft overall session countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Web Audio Analyser for Audio Orb Canvas
  useEffect(() => {
    if (!mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(mediaStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (err) {
      console.error('AudioContext setup error:', err);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaStream]);

  // Canvas Audio Orb Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pulseAngle = 0;
    const dataArray = new Uint8Array(64);

    const renderOrb = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let amplitude = 0;
      if (analyserRef.current && voiceStateRef.current === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        amplitude = sum / dataArray.length;
      }

      pulseAngle += 0.04;
      const baseRadius = 48 + Math.sin(pulseAngle) * 4;
      const activeRadius = baseRadius + (amplitude / 255) * 40;

      // Draw Outer Glow Rings
      const ringColor =
        voiceStateRef.current === 'ai_speaking'
          ? 'rgba(37, 99, 235, 0.2)'
          : voiceStateRef.current === 'listening'
          ? 'rgba(16, 185, 129, 0.25)'
          : 'rgba(100, 116, 139, 0.15)';

      ctx.beginPath();
      ctx.arc(centerX, centerY, activeRadius + 16, 0, Math.PI * 2);
      ctx.fillStyle = ringColor;
      ctx.fill();

      // Draw Inner Pulsing Orb
      const orbGradient = ctx.createRadialGradient(
        centerX - 10,
        centerY - 10,
        5,
        centerX,
        centerY,
        activeRadius
      );

      if (voiceStateRef.current === 'ai_speaking') {
        orbGradient.addColorStop(0, '#60A5FA');
        orbGradient.addColorStop(1, '#2563EB');
      } else if (voiceStateRef.current === 'listening') {
        orbGradient.addColorStop(0, '#34D399');
        orbGradient.addColorStop(1, '#059669');
      } else if (voiceStateRef.current === 'processing') {
        orbGradient.addColorStop(0, '#FBBF24');
        orbGradient.addColorStop(1, '#D97706');
      } else {
        orbGradient.addColorStop(0, '#94A3B8');
        orbGradient.addColorStop(1, '#475569');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, activeRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbGradient;
      ctx.fill();

      // Sound Wave Ripples when listening
      if (voiceStateRef.current === 'listening' && amplitude > 10) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, activeRadius + 8 + (amplitude / 255) * 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(renderOrb);
    };

    renderOrb();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Web Speech STT setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // DISCARD RECOGNITION RESULTS WHILE AI IS SPEAKING TO PREVENT TTS ECHO LOOP
        if (voiceStateRef.current === 'ai_speaking') return;

        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setCandidateAnswer(currentTranscript);
          resetSilenceTimer();
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart recognition if in listening state
        if (voiceStateRef.current === 'listening') {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Reset Silence Timer for auto-submission (1.5-2.0s post speech silence)
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (voiceStateRef.current === 'listening') {
        handleCandidateSubmitTurn();
      }
    }, 2000);
  };

  // Start STT Listening
  const startListening = () => {
    if (!recognitionRef.current || isAudioMuted) return;
    try {
      setVoiceState('listening');
      recognitionRef.current.start();
    } catch (err) {
      // Recognition might already be running
    }
  };

  // Stop STT Listening
  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
  };

  // Speak AI Message via Web Speech Synthesis (TTS)
  const speakAiMessage = (text: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isAudioMuted) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Step 1: Explicitly stop recognition to prevent echo loop
    stopListening();
    window.speechSynthesis.cancel();
    setVoiceState('ai_speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.lang.startsWith('en') && v.name.includes('Natural')) || v.name.includes('Google') || v.name.includes('Samantha')
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      // Step 2: 400ms buffer after AI stops speaking before activating candidate mic
      setTimeout(() => {
        setVoiceState('idle');
        if (onEndCallback) {
          onEndCallback();
        } else {
          startListening();
        }
      }, 400);
    };

    utterance.onerror = (err) => {
      console.error('Speech synthesis error:', err);
      setVoiceState('idle');
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Fetch Next Conversational Turn from Backend
  const fetchTurn = async (updatedTranscript: TranscriptEntry[]) => {
    setLoadingTurn(true);
    setVoiceState('processing');

    try {
      const res = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interview.id,
          category: interview.category,
          currentPhase,
          transcript: updatedTranscript,
          questionTurnCount,
          totalQuestions: interview.num_questions,
          imageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate conversational turn');

      const nextMsg = data.nextMessage || "Let's explore your technical approach further.";
      const nextPhase: SessionPhase = data.phase || currentPhase;
      const isMoveOn = Boolean(data.moveOn);
      const isRejected = Boolean(data.rejectedAnswer);

      setAiMessage(nextMsg);
      setCurrentPhase(nextPhase);
      setContextHint(data.context_hint || '');
      setShowImage(Boolean(data.showImage));
      if (data.imageUrl) setImageUrl(data.imageUrl);

      // Append AI response to running transcript
      const aiEntry: TranscriptEntry = {
        role: 'ai',
        text: nextMsg,
        timestamp: new Date().toLocaleTimeString(),
        phase: nextPhase
      };
      setTranscript((prev) => [...prev, aiEntry]);

      if (isMoveOn && nextPhase === 'questions' && !isRejected) {
        setQuestionTurnCount((prev) => prev + 1);
      }

      setLoadingTurn(false);

      // Speak AI response and enable listening upon completion
      speakAiMessage(nextMsg, () => {
        if (nextPhase === 'close') {
          setTimeout(() => handleEndSession(), 3000);
        } else {
          startListening();
        }
      });
    } catch (err) {
      console.error('Error in fetchTurn:', err);
      setLoadingTurn(false);
      const fallbackMsg = "Could you walk me through your engineering perspective on that?";
      setAiMessage(fallbackMsg);
      speakAiMessage(fallbackMsg, () => startListening());
    }
  };

  // Initial turn load (Greeting phase)
  useEffect(() => {
    fetchTurn([]);
  }, []);

  // Submit candidate answer turn
  const handleCandidateSubmitTurn = async () => {
    if (voiceStateRef.current === 'processing' || loadingTurn) return;

    const answer = candidateAnswer.trim();
    if (!answer) return;

    stopListening();
    setCandidateAnswer('');

    // Append Candidate entry to running transcript
    const candEntry: TranscriptEntry = {
      role: 'candidate',
      text: answer,
      timestamp: new Date().toLocaleTimeString(),
      phase: currentPhase
    };

    const newTranscript = [...transcript, candEntry];
    setTranscript(newTranscript);

    // Evaluate answer on backend if in questions phase
    if (currentPhase === 'questions' && aiMessage) {
      try {
        await fetch('/api/interview/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attempt.id,
            questionIndex: Math.max(1, questionTurnCount),
            question_text: aiMessage,
            candidate_answer: answer,
            category: interview.category
          })
        });
      } catch (err) {
        console.error('Error evaluating answer log:', err);
      }
    }

    // Fetch next conversational turn from LLM
    fetchTurn(newTranscript);
  };

  // End Session Handler
  const handleEndSession = async () => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      await fetch('/api/interview/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          fraud_flags: fraudFlags,
          disqualified: fraudFlags.length >= 3
        })
      });
    } catch (err) {
      console.error('Error completing session:', err);
    }

    onFinish(fraudFlags.length >= 3, fraudFlags);
  };

  const handleProctoringFlag = (flag: FraudFlag) => {
    setFraudFlags((prev) => [...prev, flag]);
  };

  // Format time remaining
  const minutesLeft = Math.floor(totalSecondsLeft / 60);
  const secondsLeft = totalSecondsLeft % 60;
  const timeFormatted = `${minutesLeft}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Invisible Proctoring Observer */}
      <ProctoringMonitor
        mediaStream={mediaStream}
        onDisqualify={() => {}}
        onFraudWarning={handleProctoringFlag}
      />

      {/* Top Floating Control Bar (Minimal & Distraction-Free) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-md">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            Live AI Session
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs font-mono text-slate-400 backdrop-blur-md">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            {timeFormatted}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white backdrop-blur-md transition-all"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Dev Debug Toggle */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-2.5 rounded-full border backdrop-blur-md transition-all ${
              showDebug ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Dev Telemetry (Ctrl+Shift+D)"
          >
            <Bug className="h-4 w-4" />
          </button>

          {/* Emergency Exit Control */}
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 rounded-full bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white transition-all shadow-md"
          >
            <X className="h-4 w-4" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Main 2-Zone Split Screen Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 h-full w-full">
        {/* ZONE 1: AI INTERVIEWER ZONE (Left on desktop, Top on mobile) */}
        <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800/80">
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Visualizer Canvas Orb */}
            <div className="relative mx-auto flex items-center justify-center">
              <canvas ref={canvasRef} width={260} height={260} className="w-64 h-64" />

              {/* Status Badge Centered Under Orb */}
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 border border-slate-800 px-4 py-1 text-xs font-semibold backdrop-blur-md shadow-lg">
                  {voiceState === 'ai_speaking' && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                      <span className="text-blue-400">AI Interviewer Speaking...</span>
                    </>
                  )}
                  {voiceState === 'listening' && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-emerald-400">Listening to Candidate...</span>
                    </>
                  )}
                  {voiceState === 'processing' && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-spin"></span>
                      <span className="text-amber-400">Analyzing Response...</span>
                    </>
                  )}
                  {voiceState === 'idle' && (
                    <span className="text-slate-400">AI Ready</span>
                  )}
                </span>
              </div>
            </div>

            {/* AI Spoken Line Text Box */}
            <div className="eightfold-card p-5 bg-slate-950/80 border-slate-800 text-left space-y-2 shadow-xl max-h-44 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Interviewer
                </span>
                <span className="capitalize text-slate-500 font-mono">Phase: {currentPhase}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {aiMessage || "Initializing conversation..."}
              </p>
            </div>

            {/* MID-INTERVIEW STOCK IMAGE CURVEBALL MODULE (Inside AI Zone) */}
            {showImage && imageUrl && (
              <div className="eightfold-card p-3 bg-slate-950 border-blue-500/40 space-y-2 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-400">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Visual Observation Round
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Describe what you see</span>
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  <img src={imageUrl} alt="Observational visual test" className="h-full w-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ZONE 2: CANDIDATE SELF-VIEW CAMERA ZONE (Right on desktop, Bottom on mobile) */}
        <div className="relative flex flex-col items-center justify-center p-6 bg-slate-950">
          <div className="w-full max-w-md space-y-4">
            {/* Live Camera Box */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />

              {/* Status Overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur-md">
                  <Video className="h-3.5 w-3.5 text-blue-400" />
                  Live Self View
                </span>
              </div>

              {/* Fraud Warning Overlay */}
              {fraudFlags.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-rose-950/90 border border-rose-500/40 p-2.5 text-[11px] text-rose-300 backdrop-blur-md">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>Proctoring Alert: {fraudFlags[fraudFlags.length - 1].message}</span>
                </div>
              )}
            </div>

            {/* Candidate Real-Time Transcribed Spoken Answer Box */}
            <div className="eightfold-card p-4 bg-slate-900/80 border-slate-800 space-y-2 text-left shadow-lg">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5" /> Spoken Candidate Input
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Auto-submits on silence</span>
              </div>

              <p className="text-xs text-slate-300 min-h-[40px] italic">
                {candidateAnswer || (voiceState === 'listening' ? "Listening... Speak your answer now..." : "Waiting for turn...")}
              </p>

              {/* Manual Turn Submit Button */}
              {voiceState === 'listening' && candidateAnswer.trim().length > 0 && (
                <button
                  onClick={handleCandidateSubmitTurn}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white shadow-md transition-all"
                >
                  <span>Submit Spoken Answer Turn</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEV DEBUG TELEMETRY PANEL (Toggleable via Ctrl+Shift+D or Bug Icon) */}
      {showDebug && (
        <div className="absolute bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto rounded-2xl border border-blue-500/40 bg-slate-900/95 p-4 text-xs text-slate-300 shadow-2xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <Bug className="h-4 w-4" /> Dev Telemetry & Transcript Inspector
            </span>
            <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
            <div>Phase: <span className="text-white">{currentPhase}</span></div>
            <div>Turns: <span className="text-white">{questionTurnCount} / {interview.num_questions}</span></div>
            <div>Entries: <span className="text-white">{transcript.length}</span></div>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
            {transcript.length === 0 ? (
              <span className="text-slate-500">No transcript entries recorded yet.</span>
            ) : (
              transcript.map((t, idx) => (
                <div key={idx} className={t.role === 'ai' ? 'text-blue-300' : 'text-emerald-300'}>
                  <strong>[{t.timestamp}] {t.role.toUpperCase()}:</strong> {t.text}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
