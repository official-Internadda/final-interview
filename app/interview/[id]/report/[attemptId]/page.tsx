'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CandidateAttempt, QuestionLog, Interview } from '@/lib/types';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Sparkles,
  TrendingUp,
  Target,
  FileText,
  Clock,
  User,
  ShieldCheck,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CandidateReportPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<CandidateAttempt | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<QuestionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/interviews`);
        const data = await res.json();
        const foundAttempt = (data.attempts || []).find((a: CandidateAttempt) => a.id === attemptId);

        if (!foundAttempt) throw new Error('Candidate attempt not found');

        setAttempt(foundAttempt);
        setInterview(foundAttempt.interview);

        if (foundAttempt.status === 'passed' && typeof window !== 'undefined') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load evaluation report');
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) loadReport();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="text-xs">Generating Executive Candidate Report...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
            <XCircle className="h-10 w-10 text-rose-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Report Not Found</h2>
            <p className="text-xs text-rose-800">{error || 'The requested evaluation report does not exist.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isQualified = attempt.status === 'passed';
  const isDisqualified = attempt.status === 'disqualified';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1">
                AI Interviewer Evaluation Report
              </span>
              <span className="text-xs text-slate-500">Standardized Rubric</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Executive Assessment Report</h1>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition-all"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            Download / Print PDF
          </button>
        </div>

        {/* Executive Score Overview Banner */}
        <div className="eightfold-card p-6 sm:p-8 shadow-sm print-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">{attempt.candidate_name}</h2>
              </div>
              <p className="text-xs text-slate-500">{attempt.candidate_email}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 pt-1">
                <span className="font-bold text-slate-900">{interview?.title || 'AI Interview'}</span>
                <span className="text-slate-400">•</span>
                <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px] text-slate-800 font-medium">
                  {interview?.category}
                </span>
              </div>
            </div>

            {/* Score Badge */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-slate-200 bg-slate-50 min-w-[180px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Overall Score</span>
              <span className="text-4xl font-extrabold text-slate-900">{attempt.score_percentage}%</span>

              <div className="mt-2">
                {isDisqualified ? (
                  <span className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Disqualified
                  </span>
                ) : isQualified ? (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Qualified (≥50%)
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-slate-500" /> Did Not Qualify
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 text-xs text-slate-700 space-y-2">
            <strong className="text-slate-900 block font-bold">Executive Assessment Summary:</strong>
            <p className="leading-relaxed text-slate-600">
              {isDisqualified
                ? 'Candidate was disqualified due to automated proctoring integrity flags recorded during the session.'
                : isQualified
                ? `Candidate successfully demonstrated solid domain competence for ${interview?.category}, crossing the 50% qualifying threshold.`
                : `Candidate score fell below the 50% qualifying bar for ${interview?.category}. Review feedback items below for improvement.`}
            </p>
          </div>
        </div>

        {/* Strengths & Improvement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-card">
          <div className="eightfold-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="h-4 w-4" /> Demonstrated Strengths
            </div>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              <li>Structured answers addressing key domain requirements.</li>
              <li>Articulate verbal delivery with proper technical terms.</li>
              <li>Maintained focus throughout evaluation turn.</li>
            </ul>
          </div>

          <div className="eightfold-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <Target className="h-4 w-4" /> Development Areas
            </div>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              <li>Incorporate deeper technical trade-off analyses.</li>
              <li>Provide specific metrics and implementation results.</li>
              <li>Use the STAR method (Situation, Task, Action, Result) for scenario questions.</li>
            </ul>
          </div>
        </div>

        {/* Proctoring Audit Log */}
        {attempt.fraud_flags && attempt.fraud_flags.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3 print-card">
            <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Proctoring Integrity Audit Log
            </div>
            <div className="space-y-2 text-xs">
              {attempt.fraud_flags.map((flag, idx) => (
                <div key={idx} className="flex justify-between border-b border-rose-200 py-1.5 text-rose-800">
                  <span>{flag.message}</span>
                  <span className="font-mono text-rose-700 text-[11px]">{flag.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
          This report was generated automatically by <strong className="text-slate-900">AI Interviewer Evaluation Engine</strong> on {new Date(attempt.created_at).toLocaleDateString()}.
        </div>
      </main>

      <Footer />
    </div>
  );
}
