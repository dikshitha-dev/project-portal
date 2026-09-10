# Database Design

## ER Overview

```
Users 1───∞ Submissions ∞───1 Weeks
Submissions 1───∞ ReviewFiles
ReviewFiles 1───∞ Annotations
Annotations 1───1 Issues
Submissions 1───1 Grades
```

---

## Tables

### users
| Column     | Type      | Constraints        |
|-----------|-----------|-------------------|
| id         | UUID      | PK, default uuid_generate_v4() |
| name       | VARCHAR   | NOT NULL           |
| email      | VARCHAR   | UNIQUE, NOT NULL   |
| password   | VARCHAR   | NOT NULL           |
| role       | VARCHAR   | CHECK in (admin, candidate) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | auto-update        |

### weeks
| Column     | Type      | Constraints  |
|-----------|-----------|-------------|
| id         | UUID      | PK          |
| week_title | VARCHAR   | NOT NULL    |
| objective  | TEXT      | NOT NULL    |
| resources  | TEXT      |             |
| deadline   | DATE      | NOT NULL    |
| created_at | TIMESTAMP |             |
| updated_at | TIMESTAMP |             |

### submissions
| Column       | Type      | Constraints |
|-------------|-----------|------------|
| id           | UUID      | PK         |
| user_id      | UUID      | FK → users, ON DELETE CASCADE |
| week_id      | UUID      | FK → weeks, ON DELETE CASCADE |
| github_url   | VARCHAR   |            |
| deployed_url | VARCHAR   |            |
| linkedin_url | VARCHAR   |            |
| reflection   | TEXT      |            |
| created_at   | TIMESTAMP |            |
| updated_at   | TIMESTAMP |            |
| UNIQUE constraint: (user_id, week_id) | | |

### review_files
| Column      | Type      | Constraints |
|------------|-----------|------------|
| id          | UUID      | PK         |
| submission_id | UUID   | FK → submissions |
| image_url   | VARCHAR   | NOT NULL   |
| file_name   | VARCHAR   |            |
| created_at  | TIMESTAMP |            |

### annotations
| Column     | Type      | Constraints |
|-----------|-----------|------------|
| id         | UUID      | PK         |
| image_id   | UUID      | FK → review_files |
| tool_type  | VARCHAR   | NOT NULL (pen, circle, rect, arrow, highlight, text) |
| coordinates| JSONB     | NOT NULL   |
| color      | VARCHAR   | DEFAULT #7C3AED |
| text       | TEXT      |            |
| created_at | TIMESTAMP |            |
| updated_at | TIMESTAMP |            |

### issues
| Column            | Type      | Constraints |
|------------------|-----------|------------|
| id                | UUID      | PK         |
| annotation_id     | UUID      | FK → annotations |
| title             | VARCHAR   | NOT NULL   |
| description       | TEXT      |            |
| priority          | VARCHAR   | CHECK (High, Medium, Low), DEFAULT Medium |
| status            | VARCHAR   | CHECK (To Do, Fixed), DEFAULT To Do |
| reference_file_url| VARCHAR   |            |
| mark_deduction    | DECIMAL   | DEFAULT 0  |
| created_at        | TIMESTAMP |            |
| updated_at        | TIMESTAMP |            |

### grades
| Column          | Type      | Constraints |
|---------------|-----------|------------|
| id              | UUID      | PK         |
| submission_id   | UUID      | FK → submissions, UNIQUE |
| ui              | DECIMAL   | 0-20       |
| functionality   | DECIMAL   | 0-25       |
| github          | DECIMAL   | 0-15       |
| documentation   | DECIMAL   | 0-10       |
| innovation      | DECIMAL   | 0-20       |
| weekly_progress | DECIMAL   | 0-10       |
| total           | DECIMAL   | auto-sum   |
| grade           | VARCHAR   | auto-calc  |
| published       | BOOLEAN   | DEFAULT FALSE |
| created_at      | TIMESTAMP |            |
| updated_at      | TIMESTAMP |            |
| UNIQUE(submission_id) |     |            |

---

## Grade Calculation

```
total = ui + functionality + github + documentation + innovation + weekly_progress

Grade:
  90-100 → A+
  80-89  → A
  70-79  → B
  60-69  → C
  <60    → Needs Improvement
```

## Indexes
- idx_submissions_user (user_id)
- idx_submissions_week (week_id)
- idx_review_files_submission (submission_id)
- idx_annotations_image (image_id)
- idx_issues_annotation (annotation_id)
- idx_grades_submission (submission_id)