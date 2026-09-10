# Database Design

## Overview
PostgreSQL with UUID primary keys. 7 tables with FK relationships and cascade deletes.

## Schema
- `users` → submits → `submissions`
- `weeks` ← references → `submissions`
- `submissions` → has → `review_files`
- `review_files` → has → `annotations`
- `annotations` → has → `issues`
- `submissions` → has → `grades`

Full DDL in `database/schema.sql`.