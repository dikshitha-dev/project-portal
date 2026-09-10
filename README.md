# Project Review & Mentorship Portal

A full-stack web app where candidates submit weekly project progress and mentors review it via annotations, issue cards, grading, and progress tracking.

**Two roles:** Admin/Mentor and Candidate

---

## Tech Stack

| Layer       | Tech                          |
|------------|-------------------------------|
| Frontend   | Next.js 14, Tailwind CSS      |
| Backend    | Flask (REST API)              |
| Database   | PostgreSQL                    |
| Auth       | JWT                           |
| Annotation | Fabric.js                     |
| Charts     | Recharts                      |

---

## Features

- **Authentication** — JWT login & registration, role-based access
- **Weekly Roadmap** — admin creates weeks (title, objective, resources, deadline)
- **Weekly Submission** — candidate submits GitHub/deployed/LinkedIn URLs, screenshots, reflection
- **Mentor Review Workspace** — Fabric.js canvas annotation (pen, circle, rect, arrow, highlight, text), issue cards linked to annotations
- **Grading** — slider rubric, auto total/percentage/grade, save draft or publish
- **Candidate Dashboard** — weekly improvement chart, grades, pending/resolved issues, feedback
- **Admin Dashboard** — candidate stats, pending reviews, average grade, search & filter

---

## Project Structure

```
project-review-portal/
├── frontend/            # Next.js app
│   ├── app/             # Pages (login, dashboard, week, submit, review, grades, admin, candidates)
│   ├── components/      # Reusable UI components
│   └── lib/             # Axios API client
├── backend/             # Flask API
│   ├── routes/          # auth, weeks, submissions, reviews, grades
│   ├── models/          # user, week, submission, issue, grade
│   ├── middleware/      # JWT auth
│   └── utils/           # jwt, upload
├── database/            # PostgreSQL schema
├── docs/                # Project documentation
└── README.md
```

---

## Getting Started

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE project_portal;"

# Apply schema
psql -U postgres -d project_portal -f database/schema.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Configure environment
set DATABASE_URL=postgresql://postgres:password@localhost:5432/project_portal

# Run Flask
python app.py                # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000


### 4. Default Admin Login

After running `schema.sql`, log in with the seeded admin (password set to `"admin"`; update via register endpoint or reset it before seeding):


### Authentication

Authentication is handled through Supabase Auth.

Administrator accounts are created and managed through Supabase Auth.
No default administrator password is stored in the repository.


---

## Grading Rubric

| Criteria        | Marks |
| --------------- | ----- |
| UI / UX         | 20    |
| Functionality   | 25    |
| GitHub Quality  | 15    |
| Documentation   | 10    |
| Innovation      | 20    |
| Weekly Progress | 10    |
| **Total**       | **100** |

**Grades:** 90+ → A+, 80+ → A, 70+ → B, 60+ → C, else Needs Improvement

---

## Documentation

See `/docs`:
- 01_Project_Overview.md
- 02_User_Flow.md
- 03_Database.md
- 04_API.md
- 05_UI_Pages.md
- 06_Features.md
- UI-Design.md
- API-Plan.md
- Database-Design.md