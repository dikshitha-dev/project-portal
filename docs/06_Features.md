# Features

## Module 1 — Authentication
- JWT-based login with role-based redirects
- Candidate → Candidate Dashboard
- Admin → Admin Dashboard
- Password hashing with werkzeug

## Module 2 — Weekly Roadmap
- Not a date calendar — a weekly task roadmap
- Fields: Week Title, Objective, Resources, Deadline
- Admin creates/edits/deletes
- Candidates view only

## Module 3 — Weekly Project Submission
- Exact fields:
  1. GitHub Repository URL
  2. Deployed Website URL
  3. LinkedIn Post URL
  4. Project Screenshots (multiple)
  5. Weekly Reflection (6-8 line textarea)
- Reflection placeholders: What did you learn? Challenges? Solutions? Progress?
- One submission per candidate per week (UNIQUE constraint)

## Module 4 — Mentor Review Workspace
- Fabric.js canvas annotation on screenshot
- Tools:
  - Pen Tool
  - Circle Tool
  - Rectangle Tool
  - Arrow Tool
  - Highlight Tool
  - Text Tool
- Color Picker (purple, red, amber, green, blue, black)
- Undo, Redo, Delete Annotation
- Each annotation linked to exact position on image
- Annotation → editable Issue Card
  - Title, Priority (High/Medium/Low), Description
  - Attach Reference File
  - Status (To Do / Fixed)
  - Mark Deduction (optional)

## Module 5 — Grading
- Slider rubric with auto-calculation
- Criteria & max marks:
  - UI/UX 20, Functionality 25, GitHub 15, Documentation 10, Innovation 20, Weekly Progress 10
- Total = 100
- Auto grade:
  - 90-100 → A+, 80-89 → A, 70-79 → B, 60-69 → C, <60 → Needs Improvement
- Save draft / Publish review

## Module 6 — Candidate Dashboard
- Overall Grade, Current Week Grade
- Weekly Improvement Graph (line chart)
- Pending Issues, Resolved Issues
- Mentor Feedback History
- GitHub & Deployment Links
- Latest Weekly Reflection

## Module 7 — Admin Dashboard
- Total Candidates, Pending Reviews
- Current Active Week, Average Grade
- Recently Submitted Projects
- Search and filter by:
  - Candidate Name
  - Week
  - Grade

## Reusable UI
- Rounded cards, soft shadows, purple/white theme
- Responsive grid layouts
- Feedback badges (green/yellow/red/purple)