'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PreCheck } from '@/components/interview/pre-check';
import { CandidateInstructions } from '@/components/interview/instructions';
import { LiveInterview } from '@/components/interview/live-interview';
import { Interview, CandidateAttempt } from '@/lib/types';
import { AlertCircle, XCircle } from 'lucide-react';

export default function CandidateInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [attempt, setAttempt] = useState<CandidateAttempt | null>(null);

  // Flow Step: 'pre-check' | 'instructions' | 'live' | 'finished'
  const [step, setStep] = useState<'pre-check' | 'instructions' | 'live' | 'finished'>('pre-check');
  const [candidateInfo, setCandidateInfo] = useState<{ name: string; email: string } | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Load Interview configuration
  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/interview/${interviewId}`);
        const data = await res.json();

        if (!res.ok || !data.interview) {
          throw new Error('Interview setup not found');
        }
        setInterview(data.interview);
      } catch (err: any) {
        setError(err.message || 'Failed to load interview session');
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) loadInterview();
  }, [interviewId]);

  // 2. Strict Privacy & Media Track Cleanup on unmount/page unload
  useEffect(() => {
    const handleCleanup = () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };

    window.addEventListener('beforeunload', handleCleanup);

    return () => {
      window.removeEventListener('beforeunload', handleCleanup);
      handleCleanup();
    };
  }, [mediaStream]);

  const handlePreCheckComplete = async (info: { name: string; email: string; stream: MediaStream }) => {
    setCandidateInfo({ name: info.name, email: info.email });
    setMediaStream(info.stream);

    try {
      // Start Candidate Attempt session
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          candidate_name: info.name,
          candidate_email: info.email
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start interview session');

      setAttempt(data.attempt);
      setStep('instructions');
    } catch (err: any) {
      alert(err.message || 'Error starting session');
    }
  };

  const handleInstructionsProceed = () => {
    setStep('live');
  };

  const handleFinish = (disqualified = false, flags: any[] = []) => {
    // Release media stream immediately on completion
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    setStep('finished');
    if (attempt) {
      router.push(`/interview/${interviewId}/report/${attempt.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="text-xs">Preparing Autonomous AI Interview Session...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
            <XCircle className="h-10 w-10 text-rose-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Interview Session Unavailable</h2>
            <p className="text-xs text-rose-800">{error || 'The requested interview link is inactive or invalid.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Active Session: Render strictly distraction-free LiveInterview component without site Navbar or Footer
  if (step === 'live' && attempt) {
    return (
      <LiveInterview
        interview={interview}
        attempt={attempt}
        mediaStream={mediaStream}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        {step === 'pre-check' && (
          <PreCheck
            interviewTitle={interview.title}
            category={interview.category}
            durationMinutes={interview.duration_minutes}
            numQuestions={interview.num_questions}
            onStart={handlePreCheckComplete}
          />
        )}

        {step === 'instructions' && candidateInfo && (
          <CandidateInstructions
            candidateName={candidateInfo.name}
            interviewTitle={interview.title}
            category={interview.category}
            numQuestions={interview.num_questions}
            durationMinutes={interview.duration_minutes}
            onProceed={handleInstructionsProceed}
          />
        )}

        {step === 'finished' && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto text-blue-600"></div>
              <p className="text-xs text-slate-500 font-semibold">Generating Candidate Evaluation Report...</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
