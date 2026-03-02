# teachersHelp

A daily command center for teachers to manage classes, schedules, students, grades, lesson plans, task checklists, and unit plans.

**Stack:** Next.js 16 (App Router) | React 19 | Prisma 7 + PostgreSQL | NextAuth 5 (JWT) | TanStack Query | AG Grid | shadcn/ui + Tailwind 4 | Zod | Zustand

---

## Quick Start

See [STARTUP.md](./STARTUP.md) for the full step-by-step guide.

```bash
docker compose up -d        # Start PostgreSQL
npm install                 # Install dependencies
npx prisma migrate dev      # Apply schema
npm run seed                # Load sample data
npm run dev                 # Start app at http://localhost:3000
```

Default login: `teacher@school.com` / `password123`

---

## Developer Docs

| File | Contents |
|------|----------|
| [STARTUP.md](./STARTUP.md) | Local setup, Docker, env variables, troubleshooting |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Architecture overview, project structure, conventions |
| [docs/frontend.md](./docs/frontend.md) | Component tree, state management, hooks, routing |
| [docs/backend.md](./docs/backend.md) | API routes, auth flow, middleware |
| [docs/database.md](./docs/database.md) | Schema, model relationships, Prisma patterns |
| [docs/request-lifecycle.md](./docs/request-lifecycle.md) | Data flow diagrams |
| [docs/gotchas.md](./docs/gotchas.md) | Tricky spots, known patterns, refactoring warnings |

---

## Infrastructure

- **Database:** PostgreSQL 16 running in Docker (`docker-compose.yml`)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Auth:** NextAuth v5 (JWT, Credentials provider, bcryptjs)
- **Dev server:** Next.js on `localhost:3000`
- **Package manager:** npm

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database with sample data |
| `npx prisma migrate dev` | Apply schema migrations |
| `npx prisma studio` | Open Prisma database browser |
| `docker compose up -d` | Start PostgreSQL container |
| `docker compose down` | Stop PostgreSQL container |
