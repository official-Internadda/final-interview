'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { INTERVIEW_CATEGORIES, DIFFICULTY_DESCRIPTIONS } from '@/lib/categories';
import { Interview, CandidateAttempt, Difficulty } from '@/lib/types';
import {
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  Search,
  Users,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(INTERVIEW_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [durationMinutes, setDurationMinutes] = useState('15');
  const [numQuestions, setNumQuestions] = useState('5');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/interviews');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setInterviews(data.interviews || []);
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/admin/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          difficulty,
          duration_minutes: parseInt(durationMinutes, 10),
          num_questions: parseInt(numQuestions, 10)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create interview');

      setIsModalOpen(false);
      setTitle('');
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Error creating interview');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/interview/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const totalPassed = attempts.filter((a) => a.status === 'passed').length;
  const totalDisqualified = attempts.filter((a) => a.status === 'disqualified').length;
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score_percentage || 0), 0) / attempts.length)
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar isAdmin={true} />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Title & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Management Console</h1>
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-0.5">
                Enterprise Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure interview links, manage difficulty evaluation standards, and review candidate attempt logs.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Create New Interview
          </button>
        </div>

        {/* Dashboard Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="eightfold-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Links</span>
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{interviews.length}</div>
            <p className="text-[11px] text-slate-500">Configured interview links</p>
          </div>

          <div className="eightfold-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Candidates</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{attempts.length}</div>
            <p className="text-[11px] text-slate-500">Candidate sessions completed</p>
          </div>

          <div className="eightfold-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pass Rate (≥50%)</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {totalPassed} <span className="text-xs text-slate-500 font-normal">({attempts.length ? Math.round((totalPassed / attempts.length) * 100) : 0}%)</span>
            </div>
            <p className="text-[11px] text-slate-500">Average Score: {avgScore}%</p>
          </div>

          <div className="eightfold-card p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Proctoring Flags</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold text-rose-600">{totalDisqualified}</div>
            <p className="text-[11px] text-slate-500">Disqualifications flagged</p>
          </div>
        </div>

        {/* Interviews Management Table */}
        <div className="eightfold-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-white">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Interview Links & Admin Difficulty Controls</h2>
              <p className="text-xs text-slate-500">Difficulty levels are visible only in this admin console</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Title</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Admin Difficulty</th>
                  <th className="py-4 px-5">Duration</th>
                  <th className="py-4 px-5">Created</th>
                  <th className="py-4 px-5 text-right">Shareable Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No interviews configured yet. Click "Create New Interview" to generate one.
                    </td>
                  </tr>
                ) : (
                  interviews.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-900">{item.title}</td>
                        <td className="py-4 px-5">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-800 font-medium border border-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500">{item.duration_minutes} min ({item.num_questions} questions)</td>
                        <td className="py-4 px-5 text-slate-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => copyToClipboard(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-slate-800 hover:border-blue-600 transition-all shadow-sm"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-blue-600" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Candidate Attempt Audit History */}
        <div className="eightfold-card overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 p-5 bg-white">
            <h2 className="text-base font-bold text-slate-900">Candidate Evaluation & Integrity Audit History</h2>
            <p className="text-xs text-slate-500">Real-time candidate score breakdown and proctoring audit log</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-5">Email</th>
                  <th className="py-4 px-5">Interview Title</th>
                  <th className="py-4 px-5">Score %</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Proctoring Flags</th>
                  <th className="py-4 px-5 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No candidate interview attempts recorded yet.
                    </td>
                  </tr>
                ) : (
                  attempts.map((attempt) => {
                    const isDisqualified = attempt.status === 'disqualified';
                    const isPassed = attempt.status === 'passed';
                    const hasFraud = attempt.fraud_flags && attempt.fraud_flags.length > 0;

                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-900">{attempt.candidate_name}</td>
                        <td className="py-4 px-5 text-slate-500">{attempt.candidate_email}</td>
                        <td className="py-4 px-5 font-medium">{attempt.interview?.title || 'Mock Interview'}</td>
                        <td className="py-4 px-5 font-extrabold text-slate-900">{attempt.score_percentage}%</td>
                        <td className="py-4 px-5">
                          {isDisqualified ? (
                            <span className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 text-[11px] font-bold">
                              Disqualified
                            </span>
                          ) : isPassed ? (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-[11px] font-bold">
                              Qualified (≥50%)
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 text-[11px] font-semibold">
                              Did Not Qualify
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {hasFraud ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {attempt.fraud_flags.length} Flag(s)
                            </span>
                          ) : (
                            <span className="text-slate-400">Clean</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <a
                            href={`/interview/${attempt.interview_id}/report/${attempt.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold"
                          >
                            <span>Report</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Interview */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Create AI Interview Link</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-slate-400 hover:text-slate-900 p-1 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateInterview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Interview Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer Technical Interview"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Category Domain
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {INTERVIEW_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Admin Difficulty Standard (Hidden from candidates)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                      const active = difficulty === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={`rounded-xl border p-2.5 text-center transition-all ${
                            active
                              ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                              : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span className="capitalize text-xs block">{d}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {DIFFICULTY_DESCRIPTIONS[difficulty]?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                      Duration (Min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                      No. of Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Save & Generate Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
