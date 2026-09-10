# UI Design Guidelines

## Color Palette
- **Primary Purple:** `#7C3AED` (buttons, active states, accents)
- **Purple Light:** `#F5F3FF` (hover backgrounds)
- **White:** `#FFFFFF` (cards, backgrounds)
- **Light Gray:** `#F8F9FC` (page background)
- **Border Gray:** `#F3F4F6` (card borders)
- **Text Gray:** `#6B7280` (secondary text)

## Typography
- **Font:** Inter (300-700 weights)
- Headings: semibold/bold
- Body: regular, gray-900/gray-600
- Small labels: 12px, uppercase-ish gray-500

## Components Style
- **Cards:** rounded-xl (12px), border gray-100, shadow-sm, padding 6
- **Buttons:**
  - Primary: bg-primary-600, white text, rounded-lg
  - Secondary: white bg, primary border, primary text
  - Danger: red-500
- **Badges:** rounded-full, tinted backgrounds (green/yellow/red/purple)
- **Inputs:** border gray-200, focus ring primary-500, rounded-lg

## Layout
- Sticky navbar top
- 256px sidebar (purple active state)
- Max content width, flexible grid
- Responsive breakpoints: mobile → sm → lg

## Pages
1. **Login** - centered card, gradient bg, role toggle
2. **Candidate Dashboard** - stat cards row, chart + side cards
3. **Roadmap** - week card grid
4. **Submission** - single column form card
5. **Review Workspace** - left list + canvas + issue board
6. **Grades** - grid for candidate, rubric for admin
7. **Admin Dashboard** - stat cards + data table
8. **Candidates** - candidate card grid