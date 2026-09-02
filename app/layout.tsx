import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'InternAdda — AI Mock Interview Platform for Upforge.org',
  description: 'Enterprise-grade AI mock interview platform powered by Groq and InternAdda for upforge.org candidates.',
  keywords: ['AI interview', 'mock interview', 'InternAdda', 'Upforge', 'technical interview', 'automated proctoring'],
  authors: [{ name: 'InternAdda Team' }]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
