# 🚀 Project Review & Mentorship Portal

A comprehensive full-stack platform where candidates submit weekly project progress, and mentors review, annotate, grade, and track candidate growth. Fully integrated with **Supabase Backend** for authentication, live data synchronization, project tracking, and grade management.

---

## 🌟 Key Features

- 🔐 **Authentication & User Management**
  - Role-Based Access Control (**Admin/Mentor** and **Candidate**).
  - Synchronized with **Supabase Backend** (`public.users` table & metadata).
- 📅 **Weekly Roadmap & Projects**
  - Admin creates weekly objectives, resources, and deadlines.
  - Candidate project joining & discovery workflow.
- 📤 **Weekly Submissions**
  - Candidates submit GitHub repos, live project URLs, LinkedIn posts, reflections, and screenshots.
- 🎨 **Mentor Review Workspace**
  - Fabric.js canvas annotation tool (pen, circle, rect, arrow, highlight, text).
  - Issue card management linked to visual canvas annotations.
- 📊 **Grading System & Rubric**
  - Interactive slider rubric with automatic total, percentage, and letter grade calculations.
  - Real-time Supabase persistence & publishing state (`Draft` vs `Published`).
- 📈 **Dashboards & Analytics**
  - Candidate Dashboard: Progress trends, weekly grades, issue status.
  - Admin Dashboard: Platform overview, pending reviews, candidate search & filter.
- 🔔 **Notifications & Social Integration**
  - Notification items for review updates.
  - LinkedIn post draft review and admin approval workflow.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Recharts, Fabric.js |
| **Backend** | Python Flask (REST API), SQLAlchemy |
| **Database & Cloud** | Supabase (PostgreSQL, Real-time RLS, REST API) |
| **Client Libraries** | `@supabase/supabase-js`, Axios, Lucide React |

---

## 📁 Project Structure

```
project-review-portal/
├── frontend/                # Next.js Application
│   ├── app/                 # App Router Pages (login, dashboard, week, submit, review, grades, admin)
│   ├── components/          # Reusable UI Components
│   ├── lib/                 # Axios API Client & Supabase Client (supabase.ts, auth.ts)
│   └── types/               # TypeScript Interface Definitions
├── backend/                 # Flask Backend API
│   ├── routes/              # API Endpoints (auth, weeks, submissions, reviews, grades, projects)
│   ├── models/              # SQLAlchemy Database Models
│   ├── utils/               # Supabase Sync Engine (supabase.py), Upload & JWT helpers
│   ├── middleware/          # Role Verification & Auth Middlewares
│   └── app.py               # Flask Application Entry Point
├── database/                # Supabase Database Schema & Migration Scripts
│   └── schema.sql           # Complete Supabase PostgreSQL Schema & RLS Policies
└── docs/                    # Project Architecture & Design Documentation
```

---

## ⚙️ Getting Started

### 1. Supabase Database Setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Copy and run the entire [`database/schema.sql`](file:///c:/Users/Dikshitha%20Chiluveru/Desktop/project-review-portal/database/schema.sql) file to set up all tables (`users`, `weeks`, `submissions`, `review_files`, `annotations`, `issues`, `grades`) and Row Level Security (RLS) policies.

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Create .env file with your credentials
# SUPABASE_URL=https://<your-project-id>.supabase.co
# SUPABASE_KEY=<your-supabase-publishable-key>

# Run Flask server
python app.py                # Runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file with your credentials
# NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-publishable-key>
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Run Next.js development server
npm run dev                  # Runs on http://localhost:3000
```

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

---

## 📚 Documentation

For full architectural details, see the `/docs` folder:
- [01_Project_Overview.md](docs/01_Project_Overview.md)
- [02_User_Flow.md](docs/02_User_Flow.md)
- [03_Database.md](docs/03_Database.md)
- [04_API.md](docs/04_API.md)
- [05_UI_Pages.md](docs/05_UI_Pages.md)
- [06_Features.md](docs/06_Features.md)