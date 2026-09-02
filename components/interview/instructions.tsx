'use client'; 

import { Sparkles, ShieldCheck, Clock, CheckCircle2, ArrowRight, Mic, Video, Lock } from 'lucide-react';

interface InstructionsProps {
  candidateName: string;
  interviewTitle: string;
  category: string;
  numQuestions: number;
  durationMinutes: number;
  onProceed: () => void;
}

export function CandidateInstructions({
  candidateName,
  interviewTitle,
  category,
  numQuestions,
  durationMinutes,
  onProceed
}: InstructionsProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
          <Sparkles className="h-3.5 w-3.5" />
          AI Interviewer • Candidate Briefing & Ground Rules
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Orientation & Session Guidelines
        </h1>
        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          Welcome, <strong className="text-slate-900 font-bold">{candidateName}</strong>! Please review the 4 ground rules before beginning your AI Voice interview.
        </p>
      </div>

      {/* Main Instructions Card */}
      <div className="eightfold-card p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{interviewTitle}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
              <span>Category Domain: <strong className="text-slate-900">{category}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-blue-600" />
            {numQuestions} Topic Turns ({durationMinutes} mins estimated)
          </div>
        </div>

        {/* 4 Ground Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Video className="h-4 w-4 text-blue-600" />
              1. In-Browser Video Monitoring
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your camera feed is monitored in real-time for presence. No video data is recorded or stored anywhere outside your browser.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Mic className="h-4 w-4 text-blue-600" />
              2. Adaptive Spoken Dialogue
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              AI Interviewer speaks questions aloud and listens to your spoken answers. Organic follow-up questions build dynamically on your responses.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              3. Anti-Cheat & Window Focus Audit
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Do not switch browser tabs or minimize the window. Focus disruptions trigger proctoring integrity flags logged on your final report.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              4. Standardized STAR Evaluation
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Candidate responses are scored against category rubrics. Candidates reaching ≥50% cross the qualification bar for the role.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Zero video/audio storage guaranteed.
          </span>

          <button
            onClick={onProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Mic className="h-4 w-4" />
            Begin AI Voice Session
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
