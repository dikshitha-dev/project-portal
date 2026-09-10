# API Reference

**Base URL:** `http://localhost:5000/api`

**Auth:** Pass `Authorization: Bearer <JWT_TOKEN>` header for protected endpoints.

---

## Authentication

### Register
`POST /auth/register`
```json
{ "name": "John Doe", "email": "john@email.com", "password": "secret", "role": "candidate" }
```

### Login
`POST /auth/login`
```json
{ "email": "john@email.com", "password": "secret" }
```
**Response:** `{ "token": "<JWT>", "user": { id, name, email, role } }`

### Get Current User
`GET /auth/me` (auth required)

### List Candidates (admin)
`GET /auth/candidates`

### Get Candidate (admin)
`GET /auth/candidates/:id`

---

## Weeks

### List Weeks (all users)
`GET /weeks/`

### Get Week (all users)
`GET /weeks/:id`

### Create Week (admin)
`POST /weeks/`
```json
{ "week_title": "Week 3", "objective": "Complete responsive UI and homepage.", "resources": "Figma, Tailwind Docs", "deadline": "2026-09-18" }
```

### Update Week (admin)
`PUT /weeks/:id`

### Delete Week (admin)
`DELETE /weeks/:id`

---

## Submissions

### Create Submission (candidate)
`POST /submissions/` — `multipart/form-data`
```
week_id
github_url
deployed_url
linkedin_url
reflection
screenshots[] (multiple image files)
```

### List Submissions (all users)
`GET /submissions/` — candidates see own, admin sees all

### Get Submission (all users)
`GET /submissions/:id`

### Update Submission (owner)
`PUT /submissions/:id`

### Upload Screenshots (owner/admin)
`POST /submissions/:id/screenshots` — `multipart/form-data`

### Submissions by Week (admin)
`GET /submissions/week/:week_id`

### Submissions by Candidate (admin)
`GET /submissions/candidate/:candidate_id`

---

## Reviews (Annotations & Issues)

### Get Annotations for Image
`GET /reviews/annotations/:image_id`

### Create Annotation (admin)
`POST /reviews/annotations`
```json
{
  "image_id": "...",
  "tool_type": "rect",
  "coordinates": { "left": 100, "top": 50, "width": 200, "height": 80 },
  "color": "#7C3AED",
  "text": null
}
```

### Update Annotation (admin)
`PUT /reviews/annotations/:id`

### Delete Annotation (admin)
`DELETE /reviews/annotations/:id`

### Create Issue Card (admin)
`POST /reviews/issues`
```json
{
  "annotation_id": "...",
  "title": "Fix nav bar",
  "description": "Nav should be sticky",
  "priority": "High",
  "status": "To Do",
  "mark_deduction": 2
}
```

### Update Issue (admin)
`PUT /reviews/issues/:id`

### Delete Issue (admin)
`DELETE /reviews/issues/:id`

### Issues by Submission (all users)
`GET /reviews/issues/submission/:submission_id`

### Issues by Candidate (owner/admin)
`GET /reviews/issues/candidate/:candidate_id`

### Upload Reference File (admin)
`POST /reviews/reference-upload` — `multipart/form-data`

### Serve Uploaded File
`GET /reviews/uploads/:filename`

---

## Grades

### Create/Update Grade (admin)
`POST /grades/`
```json
{
  "submission_id": "...",
  "ui": 18,
  "functionality": 22,
  "github": 14,
  "documentation": 9,
  "innovation": 17,
  "weekly_progress": 8,
  "published": false
}
```
Auto-calculates `total` and `grade`.

### Get Grade by Submission
`GET /grades/submission/:submission_id` (candidates only see published)

### Publish Grade (admin)
`POST /grades/publish/:submission_id`

### Candidate Grades
`GET /grades/candidate/:candidate_id`

### All Grades (admin)
`GET /grades/all`

### Candidate Stats
`GET /grades/stats/candidate/:candidate_id`

### Overview Stats (admin)
`GET /grades/stats/overview`

---

## Roles & Permissions

| Endpoint Group | Candidate | Admin |
|---------------|----------|-------|
| auth/register  | ✓         | ✓     |
| auth/login     | ✓         | ✓     |
| weeks (GET)    | ✓         | ✓     |
| weeks (POST/PUT/DELETE) | ✗ | ✓     |
| submissions (create own) | ✓ | ✗ |
| submissions (view) | own    | all   |
| annotations    | ✗         | ✓     |
| issues (create/update) | ✗ | ✓     |
| issues (view)  | own       | all   |
| grades (view)  | published only | all |
| grades (create/publish) | ✗ | ✓ |