# User Flow

## Candidate Flow

1. **Register/Login** → `/login`
2. **View Weekly Roadmap** → `/week` (read-only, shows week title, objective, resources, deadline)
3. **Submit Weekly Project** → `/submit`
   - Fill GitHub URL, Deployed URL, LinkedIn URL
   - Upload multiple screenshots
   - Write weekly reflection
4. **Track Progress** → `/dashboard`
   - View overall grade, current week grade
   - Weekly improvement line chart
   - Pending/Resolved issues
   - Mentor feedback history
   - Latest reflection
5. **View Grades** → `/grades` (read-only published grades)

---

## Admin/Mentor Flow

1. **Login** → `/login`
2. **Create Weekly Roadmap** → `/week` (create/edit/delete weeks)
3. **View Candidates** → `/candidates` (list all, search by name)
4. **Review Submissions** → `/review`
   - Select candidate submission
   - Open screenshot in annotation workspace
   - Draw annotations (pen, circle, rect, arrow, highlight, text)
   - Each annotation becomes an Issue Card
     - Title, Priority, Description, Status, Mark Deduction
   - Reference files can be attached
5. **Grade Projects** → `/grades`
   - Select submission
   - Use sliders for 6 rubric criteria
   - Auto-calculate total, percentage, grade
   - Save draft or publish review
6. **Monitor Dashboard** → `/admin`
   - Total candidates, pending reviews, active week, average grade
   - Recent submissions with search/filter

---

## Workflow Sequence

```
1. Admin creates Week 1 roadmap
2. Candidate views Week 1 roadmap
3. Candidate submits GitHub, deployment, LinkedIn, screenshots, reflection
4. Mentor opens screenshots in annotation workspace
5. Mentor draws annotations and creates issue cards
6. Mentor grades the project using rubric
7. Candidate views feedback and weekly improvement chart
```