# Project Review & Mentorship Portal

## Overview

A modern full-stack web application where candidates submit their weekly project progress and mentors review it through annotations, issues, grading, and progress tracking.

## Tech Stack

| Layer       | Technology                    |
|------------|-------------------------------|
| Frontend   | Next.js, Tailwind CSS         |
| Backend    | Flask (REST API)              |
| Database   | PostgreSQL                    |
| Auth       | JWT                           |
| File Store | Supabase Storage              |
| Canvas     | Fabric.js                     |
| Charts     | Recharts                      |

## User Roles

- **Admin / Mentor** - Create roadmaps, review submissions, annotate screenshots, grade projects
- **Candidate** - View roadmaps, submit weekly progress, view feedback & grades

## Modules

1. **Authentication** - JWT login for Admin & Candidate
2. **Weekly Roadmap** - Admin creates week title, objective, resources, deadline
3. **Weekly Submission** - GitHub URL, deployed URL, LinkedIn URL, screenshots, reflection
4. **Mentor Review Workspace** - Fabric.js annotation canvas with pen, circle, rect, arrow, highlight, text tools
5. **Grading** - Rubric with sliders, auto-calculate total, percentage, grade
6. **Candidate Dashboard** - Weekly improvement graph, grades, pending/resolved issues
7. **Admin Dashboard** - Total candidates, pending reviews, average grade, search & filter

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

### Grade Scale
- 90-100 → A+
- 80-89 → A
- 70-79 → B
- 60-69 → C
- Below 60 → Needs Improvement

## Folder Structure

```
project-review-portal/
├── frontend/           # Next.js application
├── backend/            # Flask REST API
├── database/           # PostgreSQL schema
├── docs/               # Documentation
└── README.md
```