# InternAdda — AI-Powered Mock Interview Platform

Full-stack AI-powered mock interview platform white-labeled for **upforge.org** ("Powered by InternAdda for Upforge.org"). Features a **Super Premium Silver/White Executive Theme**, a **Perplexity-Style Voice Mode UI**, and automated proctoring.

---

## 🔐 Default Admin Credentials

- **Admin Login Page**: `/admin/login`
- **Username**: `upforge`
- **Password**: `Upforge@24/7`

---

## 🔑 Where to Add API Keys (To Make it Fully Live & Working)

### Step 1: Get Your Free API Keys

1. **Groq API Key (AI Voice Interviewer & Evaluator)**:
   - Go to [Groq Console](https://console.groq.com/keys)
   - Create a free API Key (starts with `gsk_...`).

2. **Supabase Postgres Database (Free Tier)**:
   - Go to [Supabase Console](https://supabase.com)
   - Create a new project.
   - Go to **Project Settings** -> **API** to copy your `Project URL` and `anon public key`.
   - Go to the **SQL Editor** in Supabase and paste/run the contents of `schema.sql`.

---

### Step 2: Configure Environment Variables

#### For Local Development:
Create a file named `.env.local` in the project root:

```env
# Groq API Key
GROQ_API_KEY=gsk_your_groq_key_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Auth Secret
ADMIN_JWT_SECRET=internadda-super-secret-admin-token-2026
```

#### For Live Production on Vercel:
1. Go to your project on **[Vercel Dashboard](https://vercel.com)**.
2. Navigate to **Settings** -> **Environment Variables**.
3. Add `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Redeploy project.

---

## 🌟 Key Features

1. **Super Premium Silver/White Executive UI**: Sleek silver glassmorphism, glowing accents, clean typography, and a **Light/Dark Theme Switcher**.
2. **Perplexity-Style Voice Mode**:
   - **Glowing Interactive Audio Orb**: Pulsing orb visualizer showing when InternAdda AI is speaking or listening.
   - **Text-to-Speech (TTS)**: InternAdda AI speaks questions aloud using Web Speech Synthesis.
   - **Speech-to-Text Recording**: Candidates speak their answers directly via microphone or type as fallback.
3. **Automated Proctoring**: Client-side face detection + tab switch monitoring with instant disqualification on integrity violations.
4. **22 Corporate Categories & Difficulty Tiers**: Tailored evaluation rubrics for AI/ML, Finance, Sales, Product, Legal, HR, etc.
5. **Printable Candidate Reports**: Executive PDF print export with score breakdowns and strengths analysis.

---

## 🚀 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login) (`upforge` / `Upforge@24/7`)
- **Demo Voice Interview**: [http://localhost:3000/interview/demo-interview-1](http://localhost:3000/interview/demo-interview-1)
