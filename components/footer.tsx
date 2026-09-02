import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 py-8 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">AI Interviewer</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Europe's Privacy-First Talent Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Zero Media Retention Guaranteed
            </span>
            <span>GDPR Compliant</span>
            <span>EU AI Act Aligned</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © {new Date().getFullYear()} AI Interviewer Europe. Live camera and microphone data are analyzed strictly in-browser for real-time evaluation and are never recorded or stored.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-slate-900 transition-colors">Security Architecture</Link>
            <Link href="/" className="hover:text-slate-900 transition-colors">Fairness Rubric</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

