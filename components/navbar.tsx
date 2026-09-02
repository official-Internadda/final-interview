'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm shrink-0">
              <Image
                src="/logo.jpg"
                alt="AI Interviewer Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  AI Interviewer
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Enterprise
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Europe's privacy-first hiring assistant
              </span>
            </div>
          </Link>
        </div>

        {/* Action Button */}
        <nav className="flex items-center gap-3">
          {isAdmin ? (
            <button
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/interview/demo-interview-1"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              Start Interview
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

