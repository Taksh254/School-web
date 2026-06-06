# Tiny Mind Play School — Preschool Website

A full-featured preschool website built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase (auth + database), and Framer Motion.

---

## Current Status — June 2026

The project is **feature-complete** and running in development mode at `http://localhost:3000`. It is configured for Vercel deployment (region: `bom1` — Mumbai, India).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, webpack) |
| Language | TypeScript ~5 (strict mode) |
| Styling | Tailwind CSS 3.4.17 + PostCSS |
| Animations | Framer Motion 12.40.0, @use-gesture/react |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| Icons | Lucide React |
| UI Primitives | Radix Slot, CVA, clsx, tailwind-merge |
| Fonts | Nunito (display), Inter (body), Caveat (handwriting) |
| Linting | ESLint 9 (Next.js core-web-vitals) |

---

## Routes Overview

### Public Pages (no auth required)

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, trust cards, programs, activities, gallery, teachers, testimonials |
| `/about` | School story, values, team |
| `/programs` | Program details with accordion |
| `/gallery` | Full-screen 3D DomeGallery |
| `/admissions` | Process, inquiry form, FAQs |
| `/contact` | Contact form + info |
| `/parent-corner` | Resources for parents |
| `/login` | Login / signup with demo bypass |

### Admin Dashboard (`/dashboard/admin/*`)

| Route | Description |
|-------|-------------|
| `/dashboard/admin` | Overview stats, class breakdown, fee collection |
| `/dashboard/admin/students` | CRUD student records, filter by program, search |
| `/dashboard/admin/fees` | Create/manage fees, mark paid with receipt |
| `/dashboard/admin/announcements` | CRUD announcements with publish toggle |
| `/dashboard/admin/reports` | Monthly fee chart, class-wise breakdown, attendance |
| `/dashboard/admin/principal` | Edit principal profile |
| `/dashboard/admin/supabase-test` | Supabase connection debug panel |

### Parent Dashboard (`/dashboard/parent/*`)

| Route | Description |
|-------|-------------|
| `/dashboard/parent` | Child info, stats, recent announcements/notes/events |
| `/dashboard/parent/attendance` | Monthly calendar with color-coded status |
| `/dashboard/parent/fees` | Fee breakdown, history, printable receipt |
| `/dashboard/parent/announcements` | Published announcements |
| `/dashboard/parent/events` | Upcoming events |
| `/dashboard/parent/notes` | Teacher notes by category |

---

## Database (Supabase)

8 tables with Row-Level Security:

- **students** — Student records linked to programs
- **profiles** — User profiles (admin/parent roles)
- **attendance** — Daily attendance per student
- **fees** — Fee records with status tracking
- **payments** — Payment transactions with receipt numbers
- **announcements** — School announcements with priority & publish state
- **events** — Calendar events by type
- **notes** — Teacher notes per student by category

20 RLS policies enforce role-based access: parents see only their own child's data; admins have full access.

---

## Architecture Highlights

- **Auth**: Custom React context (`useAuth()`) supporting both Supabase Auth and localStorage fallback
- **Data layer** (`src/lib/data-store.ts`): Dual-storage pattern — Supabase primary with localStorage seed data fallback
- **Middleware** (`src/middleware.ts`): Route protection with role-based redirects (admins vs parents)
- **Animations**: Reusable `AnimatedElement` component for scroll-triggered reveals; 3D DomeGallery with gesture support
- **Dashboard UI**: Shared components — `DataTable` (sortable/searchable), `Modal`, `StatCard`, `EmptyState`, `Receipt` (printable)

---

## Key File Counts

| Area | Files | Lines |
|------|-------|-------|
| Pages (`src/app/`) | 20 | ~2,800 |
| Components (`src/components/`) | 25 | ~2,600 |
| Library (`src/lib/`) | 6 | ~1,200 |
| Styles + Configs | 8 | ~700 |
| Schema (`schema.sql`) | 1 | 253 |
| **Total (src/)** | **65** | **~8,900** |

---

## How to Run

```bash
npm run dev       # Development (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
```

## Environment Variables

Required (in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Deployment

Configured for Vercel via `vercel.json`. Build command: `npm run build`. Region: `bom1` (Mumbai).

Security headers enabled; aggressive caching (1 year, immutable) for images, videos, JS, CSS, and fonts.
