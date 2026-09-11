# 🚀 Project Review & Mentorship Portal

A comprehensive full-stack platform where candidates submit weekly project progress, and mentors review, annotate, grade, and track candidate growth. Built with **Next.js 14 App Router** and fully powered by **Supabase** for Auth, PostgreSQL database, RLS authorization, and Storage.

---

## 🌟 Key Features

- 🔐 **Supabase Authentication & Role Management**
  - Native Supabase Auth (`@supabase/ssr`) for candidates, mentors, and admins.
  - Role-Based Access Control (`admin`, `mentor`, `candidate`) driven directly by `public.profiles`.
  - Automatic profile creation upon registration (`on_auth_user_created` trigger).
- 📅 **Weekly Roadmap & Projects**
  - Admin creates projects, weekly objectives, resources, and deadlines.
  - Candidate project joining with invite codes & discovery workflow.
- 📤 **Weekly Submissions**
  - Candidates submit GitHub repos, live project URLs, LinkedIn posts, reflections, and screenshots.
- 🎨 **Mentor Review Workspace**
  - Canvas annotation tool (pen, circle, rect, arrow, highlight, text).
  - Issue card management linked to visual canvas annotations.
- 📊 **Grading System & Rubric**
  - Interactive slider rubric with automatic total, percentage, and letter grade calculations.
  - PostgreSQL RLS enforces draft vs published grade visibility for candidates.
- 📈 **Dashboards & Access Control**
  - **Candidate Portal**: Only candidate's own data (`Candidate A ≠ Candidate B`).
  - **Mentor Portal**: Restricted to candidates assigned via `mentor_assignments`.
  - **Admin Portal**: Platform overview, pending reviews, user role management & project control.
- 🔔 **Notifications & Social Integration**
  - Real-time review notification updates.
  - LinkedIn post draft review and admin approval workflow.

---

## 🛠️ Architecture & Tech Stack

```text
                    ┌─────────────────┐
                    │  Next.js 14 UI  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Supabase Auth  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    profiles     │
                    │ role management │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
          Candidate        Mentor         Admin
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │ PostgreSQL + RLS│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Supabase Storage│
                    └─────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Fabric.js |
| **Authentication** | Supabase Auth (`@supabase/ssr`) |
| **Database** | Supabase PostgreSQL (16 tables) |
| **Authorization** | PostgreSQL Row Level Security (RLS) |
| **Storage** | Supabase Storage (`project-screenshots`, `post-media`) |
| **Services / Client** | Clean TypeScript Service Architecture (`frontend/lib/services/`) |

---

## 📁 Project Structure

```
project-review-portal/
├── frontend/                # Next.js 14 Application
│   ├── app/                 # App Router Pages (login, candidate, mentor, admin, review, grades, linkedin)
│   ├── components/          # Reusable UI & Layout Components
│   ├── hooks/               # Custom React Hooks (useAuth)
│   ├── lib/                 # Supabase SSR clients & API Services
│   │   ├── services/        # Clean Supabase Data Services (auth, profiles, projects, submissions, etc.)
│   │   └── supabase/        # @supabase/ssr clients (client, server, middleware)
│   └── types/               # TypeScript Definitions
├── database/                # Supabase Database Schema & RLS Scripts
│   └── schema.sql           # Complete Supabase PostgreSQL Schema & RLS Policies
├── supabase/                # Migration Management
│   └── migrations/          # 001_complete_schema.sql
└── docs/                    # Project Architecture & Guidelines
```

---

## ⚙️ Getting Started

### 1. Supabase Setup

1. Create a project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Execute `supabase/migrations/001_complete_schema.sql` (or `database/schema.sql`) to set up all 16 PostgreSQL tables, indexes, triggers, and RLS policies.
4. Ensure the following Storage Buckets exist and are set up:
   - `project-screenshots`
   - `post-media`

### 2. Frontend Environment Setup

Create `frontend/.env.local` (or configure environment variables):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

### 3. Install & Run

```bash
cd frontend

# Install dependencies
npm install

# Run Next.js dev server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📐 Grading Rubric

| Criteria | Max Marks | Description |
| :--- | :---: | :--- |
| **UI / UX** | 20 | Design aesthetics, responsiveness, layout |
| **Functionality** | 25 | Working features, code correctness |
| **GitHub Quality** | 15 | Commit quality, clean repo structure, README |
| **Documentation** | 10 | Clarity of explanation, code comments |
| **Innovation** | 20 | Creative problem solving, extra features |
| **Weekly Progress** | 10 | Timely submissions & progress consistency |
| **Total** | **100** | |

**Grade Breakdown:**
- `90+` → **A+**
- `80 - 89` → **A**
- `70 - 79` → **B**
- `60 - 69` → **C**
- `< 60` → **Needs Improvement**