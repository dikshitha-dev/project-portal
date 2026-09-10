# API Plan

## Auth (`/api/auth`)
- POST `/register` — create user (name, email, password, role)
- POST `/login` — JWT token + user
- GET `/me` — current user
- GET `/candidates` (admin)
- GET `/candidates/:id` (admin)

## Weeks (`/api/weeks`)
- GET `/` — list all weeks
- GET `/:id` — one week
- POST `/` (admin) — create week
- PUT `/:id` (admin) — update week
- DELETE `/:id` (admin) — delete week

## Submissions (`/api/submissions`)
- POST `/` (candidate) — create submission + upload screenshots (multipart)
- GET `/` — list (candidate=own, admin=all)
- GET `/:id`
- PUT `/:id` — update own
- POST `/:id/screenshots` — add screenshots
- GET `/week/:week_id` (admin)
- GET `/candidate/:candidate_id` (admin)

## Reviews (`/api/reviews`)
- GET `/annotations/:image_id`
- POST `/annotations` (admin)
- PUT `/annotations/:id` (admin)
- DELETE `/annotations/:id` (admin)
- POST `/issues` (admin)
- PUT `/issues/:id` (admin)
- DELETE `/issues/:id` (admin)
- GET `/issues/submission/:submission_id`
- GET `/issues/candidate/:candidate_id`
- POST `/reference-upload` (admin)
- GET `/uploads/:filename`

## Grades (`/api/grades`)
- POST `/` (admin) — create/update grade, auto-calc total+grade
- GET `/submission/:submission_id`
- POST `/publish/:submission_id` (admin)
- GET `/candidate/:candidate_id`
- GET `/all` (admin)
- GET `/stats/candidate/:candidate_id`
- GET `/stats/overview` (admin)

## Conventions
- JSON responses `{ "message": "...", data... }`
- Errors `{ "error": "message" }` with proper status codes
- JWT via `Authorization: Bearer <token>`
- Multipart for file uploads
- Admin endpoints protected by role middleware