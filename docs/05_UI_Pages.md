# UI Pages & Design System

## Theme
- **Primary Purple:** `#7C3AED`
- **White Background:** `#FFFFFF`
- **Light Gray BG:** `#F8F9FC`
- **Border:** `#F3F4F6`
- Style inspiration: Notion + Linear + Figma comments
- Rounded cards, soft shadows, responsive layouts

---

## Pages

### 1. `/login`
Admin & Candidate authentication. Login/Register toggle, role selector, purple gradient background.

### 2. `/dashboard` (Candidate)
- Greeting with name
- Stat cards: Overall Grade, Pending Issues, Resolved Issues, Avg Score
- Weekly Performance line chart (Recharts)
- Current Week card
- Latest links (GitHub, Deployed, LinkedIn)
- Mentor feedback history
- Latest weekly reflection

### 3. `/week` (Roadmap)
- Candidate: read-only cards showing Week Title, Objective, Resources, Deadline
- Admin: create/edit/delete week cards

### 4. `/submit` (Submission Form)
- Week selector (only unsubmitted weeks)
- GitHub URL, Deployed URL, LinkedIn URL inputs
- Multiple screenshot file upload
- Weekly reflection textarea (6-8 lines)

### 5. `/review` (Mentor Workspace)
- Left panel: submissions list + screenshot thumbs
- Center: Fabric.js annotation canvas
- Annotation toolbar: Pen, Circle, Rectangle, Arrow, Highlight, Text, Color Picker, Undo, Redo, Delete
- Issue form: Title, Priority, Description, Mark Deduction, Status
- Issue Board with editable cards

### 6. `/grades`
- **Candidate:** grid of GradeCards (week, score, letter grade, breakdown bars)
- **Admin:** submission selector + slider rubric + auto total/percentage/grade + save draft/publish

### 7. `/admin` (Admin Dashboard)
- Stat cards: Total Candidates, Pending Reviews, Total Weeks, Average Grade
- Recent submissions table with search/filter (candidate, week, grade)

### 8. `/candidates`
- Grid of candidate cards: avatar, name, email, submissions count, avg score, grade
- Search by name/email

---

## Components (`components/`)

| Component             | Purpose |
|----------------------|---------|
| Navbar.jsx            | Top nav with logo, user info, logout |
| Sidebar.jsx           | Role-based nav links |
| WeekCard.jsx          | Roadmap card display |
| SubmissionForm.jsx    | Weekly submission form |
| GradeCard.jsx         | Grade display with breakdown |
| IssueCard.jsx         | Editable issue card |
| AnnotationToolbar.jsx | Annotation tools + colors + undo/redo/delete |
| ProgressChart.jsx     | Recharts line chart wrapper |
| AppLayout.jsx         | Navbar + Sidebar + main wrapper |

---

## Layout

```
┌──────────────────────────────┐
│   Navbar (sticky top)        │
├────────────┬─────────────────┤
│  Sidebar   │  Main Content   │
│  (w-64)    │  (flex-1)       │
└────────────┴─────────────────┘
```