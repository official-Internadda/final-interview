import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Mic,
  Lock,
  Clock,
  CheckCircle2,
  Users,
  Award,
  Video,
  FileCheck,
  Building2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                AI Interviewer • Europe's Privacy-First Talent Intelligence Platform
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Autonomous AI Interviews.<br />
                <span className="text-blue-600">Uncompromising Rigor & Privacy.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Evaluate candidate competence 24/7 with adaptive voice probing, active in-browser proctoring, and standardized STAR methodology rubrics. Live camera and mic feeds are processed in real-time — zero raw video or audio is ever recorded or saved.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/interview/demo-interview-1"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                >
                  <Mic className="h-4 w-4" />
                  Try AI Interviewer Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all"
                >
                  <Lock className="h-4 w-4 text-slate-500" />
                  Admin Login
                </Link>
              </div>

              {/* Proof Strip directly below hero */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200 text-left">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">100%</div>
                  <div className="text-xs font-medium text-slate-500">Privacy-First (Zero Media Saved)</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">24+</div>
                  <div className="text-xs font-medium text-slate-500">Specialized Domain Roles</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">90%</div>
                  <div className="text-xs font-medium text-slate-500">Faster Time-to-Interview</div>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Demonstration Box */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900 aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                  alt="Candidate conducting AI Voice Interview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                {/* Live Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl border border-slate-700/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="font-semibold">Live In-Browser Session</span>
                  </div>
                  <span className="text-blue-400 font-mono text-[11px]">ACTIVE ● ZERO MEDIA SAVED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Wall: Trust & Enterprise Alignment */}
      <section className="py-10 bg-slate-100/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            TRUSTED BY FORWARD-THINKING ENTERPRISE TALENT TEAMS ACROSS EUROPE
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60 grayscale">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <Building2 className="h-5 w-5" /> EUROTALENT
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <Award className="h-5 w-5" /> NORDIC HR
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <ShieldCheck className="h-5 w-5" /> VANGUARD TECH
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <FileCheck className="h-5 w-5" /> ALLIANCE RECRUITING
            </div>
          </div>
        </div>
      </section>

      {/* Numbered 3-Step "How It Works" Flow */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            HUMAN-SCALE TO AGENT-SCALE RECRUITING
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How AI Interviewer Works
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mx-auto">
            A seamless 3-step candidate assessment journey designed for high fairness, active integrity monitoring, and immediate score reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="eightfold-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900">Consent & Hardware Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Candidates enter the session, review our explicit zero-storage privacy statement, and verify microphone and camera streams before starting.
            </p>
          </div>

          <div className="eightfold-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900">Conversational Voice Session</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI Interviewer speaks questions aloud, visualizes real-time speech via an interactive audio orb, and asks adaptive follow-ups based on candidate responses.
            </p>
          </div>

          <div className="eightfold-card p-8 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900">Executive Intelligence Report</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instantly review standardized competency rubrics, STAR-method strengths, and tab-switch proctoring logs formatted for PDF export.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid: Enterprise Standards */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Built for Executive Hiring Rigor & Total Fairness
            </h2>
            <p className="text-xs text-slate-600 max-w-xl mx-auto">
              Evaluates what candidates say, not who they are or how they sound.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Adaptive Dialogue Probing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than reading static scripts, AI Interviewer analyzes candidate answers in real time and asks context-aware technical follow-ups.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">In-Browser Proctoring Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitors tab switching, window focus, and camera presence locally without transmitting video streams outside the browser.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Rigor & Hard Mode Standard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When configured to Hard difficulty, evaluation rubrics strictly enforce STAR methodology, concrete technical metrics, and trade-off analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Everything You Need to Know</h2>
        </div>

        <div className="space-y-4">
          <div className="eightfold-card p-6 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Is video or audio recorded or saved?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. Live camera and microphone streams are evaluated exclusively in real-time within your browser. Zero media files or raw recordings are saved to server storage or database records.
            </p>
          </div>

          <div className="eightfold-card p-6 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">How does the adaptive probing question loop work?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI Interviewer uses Groq LLM integration to analyze your spoken answers and generate organic follow-up questions tailored to your specific background and category domain.
            </p>
          </div>

          <div className="eightfold-card p-6 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">What happens if I switch tabs during the session?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The in-browser proctoring monitor detects tab switching and window blur events, logging them as proctoring integrity flags on your final report.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
