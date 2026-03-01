# Developer Guide

A daily command center for teachers to manage classes, schedules, students, grades, tasks, and unit plans.

**Stack:** Next.js 16 (App Router) | React 19 | Prisma 7 + PostgreSQL | NextAuth 5 (JWT) | TanStack Query | AG Grid | shadcn/ui + Tailwind 4 | Zod | Zustand

---

## Architecture at a Glance

```
Browser
  |
  |  fetch("/api/...")
  v
[ Next.js Middleware ] ── cookie check ── redirect /login if no session
  |
  |  passes through
  v
[ API Route Handlers ]  ── auth() verifies JWT ── prisma.* talks to DB
  ^                                                        |
  |  JSON responses                                        v
  |                                                  [ PostgreSQL ]
  v
[ React Client Components ]
  |-- TanStack Query (server state cache)
  |-- Zustand (ephemeral UI state)
  |-- AG Grid (gradebook spreadsheet)
  |-- shadcn/ui (all other UI)
```

**Detailed docs:**

| File | Contents |
|------|----------|
| [frontend.md](./frontend.md) | Component tree, state management, hooks, routing |
| [backend.md](./backend.md) | API routes, auth flow, middleware, task generation |
| [database.md](./database.md) | Schema ERD, model relationships, Prisma patterns |
| [request-lifecycle.md](./request-lifecycle.md) | Path of a request, data flow diagrams |
| [gotchas.md](./gotchas.md) | Tricky spots, refactoring warnings, known patterns |

---

## Quick Start

```bash
# Install
npm install

# Set up env (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
cp .env.example .env

# DB setup
npx prisma migrate dev
npx prisma db seed

# Dev server
npm run dev        # http://localhost:3000
```

---

## Project Structure

```
src/
  app/                     # Next.js App Router pages + API routes
    api/                   # REST API (all routes)
      auth/[...nextauth]/  # NextAuth handler
      calendar/            # Calendar assignment data
      classes/[id]/        # Classes CRUD + nested resources
        assignments/       #   Assignment CRUD
        categories/        #   Grade category weights
        grades/            #   Bulk grade updates
        schedule/          #   Class schedule CRUD
        students/          #   Student CRUD + batch create
        unit-plans/        #   Unit plan CRUD + nested units/sub-units
      dashboard/           # Dashboard aggregation endpoint
      register/            # User registration
      settings/            # User preferences
      tasks/               # Task CRUD + generate + reorder
    classes/[id]/          # Class detail, gradebook, students, unit-plans pages
    calendar/              # Calendar page
    login/ + register/     # Auth pages
    settings/              # Settings page
    tasks/                 # Tasks page
  components/
    calendar/              # CalendarView (monthly/weekly/daily)
    classes/               # ClassForm, ClassCard, ClassListClient, ScheduleBuilder
    dashboard/             # DashboardClient, StatsBar, ScheduleStrip, TaskFeed
    gradebook/             # GradebookClient, GradeGrid (AG Grid), CategoryWeights, AddAssignmentDialog
    layout/                # AppShell, Sidebar
    providers/             # SessionProvider, QueryProvider
    settings/              # SettingsClient
    students/              # QuickStudentEntry
    tasks/                 # TaskList, TaskItem, TaskForm
    ui/                    # shadcn/ui primitives (button, card, dialog, etc.)
    unit-plans/            # UnitPlanClient, UnitPlanTable, CreateUnitPlanDialog
  hooks/                   # TanStack Query hooks (one per domain)
  lib/                     # Auth config, Prisma client, Zod schemas, utilities
  stores/                  # Zustand stores (taskStore for drag state)
  types/                   # TypeScript types, NextAuth augmentation
```

---

## Key Conventions

1. **Every API route** starts with `auth()` check and `userId` extraction
2. **Every hook file** maps 1:1 to a domain (classes, students, tasks, etc.)
3. **Query keys** follow the pattern `["domain"]` or `["domain", id]`
4. **Mutations** always invalidate related query keys on success
5. **Zod schemas** in `lib/validations.ts` are the single source of truth for input validation
6. **All IDs** are CUIDs (Prisma `@default(cuid())`)
7. **No SSR data fetching** -- all data is fetched client-side via TanStack Query
