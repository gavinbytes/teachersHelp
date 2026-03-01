# Backend Architecture

## Overview

The backend is entirely **Next.js API Route Handlers** (no separate server). All routes live under `src/app/api/` and follow REST conventions. The database is PostgreSQL accessed via Prisma 7 with the `@prisma/adapter-pg` driver adapter.

---

## Authentication Flow

```
                    ┌──────────────────────────────┐
                    │        middleware.ts          │
                    │  Checks cookie exists         │
                    │  Redirects to /login if not   │
                    └──────────┬───────────────────┘
                               │ request passes through
                               v
                    ┌──────────────────────────────┐
                    │     API Route Handler         │
                    │  const session = await auth() │
                    │  JWT verified, user.id ready  │
                    └──────────────────────────────┘
```

**Auth stack:** NextAuth v5 (beta) with JWT strategy + Credentials provider.

**Key files:**
- `src/lib/auth.ts` -- NextAuth config (credentials provider, JWT callbacks)
- `src/middleware.ts` -- route protection (cookie check)
- `src/app/api/auth/[...nextauth]/route.ts` -- NextAuth handler
- `src/app/api/register/route.ts` -- user registration (bcrypt hash)
- `src/types/next-auth.d.ts` -- augments Session type with `user.id`

**How login works:**
1. User POSTs email/password to NextAuth credentials provider
2. `authorize()` finds user by email, compares bcrypt hash
3. On success, JWT is created with `user.id` in token
4. Session cookie (`authjs.session-token`) is set

**How API routes verify auth:**
```ts
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = session.user.id;
```

**Resource ownership:** Every query filters by `userId` to ensure data isolation between teachers. Nested resources (students, assignments) verify class ownership:
```ts
const classData = await prisma.class.findUnique({ where: { id }, select: { userId: true } });
if (classData.userId !== userId) return 403;
```

---

## API Routes Reference

All routes require authentication unless noted. Request/response bodies are JSON.

### Classes
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes` | -- | `ClassWithSchedule[]` |
| POST | `/api/classes` | `{ name, subject, color?, room?, startDate?, endDate?, schedules? }` | Created class |
| GET | `/api/classes/[id]` | -- | `ClassWithDetails` (includes students, categories, assignments) |
| PATCH | `/api/classes/[id]` | Partial class fields | Updated class |
| DELETE | `/api/classes/[id]` | -- | 204 |

### Students
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes/[id]/students` | -- | `Student[]` |
| POST | `/api/classes/[id]/students` | `{ student_name, email? }` OR `{ count }` | Student or `{ created: N }` |
| PATCH | `/api/classes/[id]/students/[studentId]` | `{ student_name?, email? }` | Updated student |
| DELETE | `/api/classes/[id]/students/[studentId]` | -- | 204 |

**Batch creation:** POST with `{ count: 25 }` creates "Student 1" through "Student 25".

**Name parsing:** The API accepts `student_name` as a single string. `parseStudentName()` splits on first space into `firstName`/`lastName`. Single-word names get an empty `lastName`.

### Schedule
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| POST | `/api/classes/[id]/schedule` | `{ dayOfWeek, startTime, endTime }` | Created schedule |
| DELETE | `/api/classes/[id]/schedule` | `{ id: scheduleId }` | 204 |

### Assignments
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes/[id]/assignments` | -- | Assignments with categories |
| POST | `/api/classes/[id]/assignments` | `{ name, type, points, dueDate?, categoryId? }` | Created assignment |
| PATCH | `/api/classes/[id]/assignments/[assignmentId]` | Partial fields | Updated |
| DELETE | `/api/classes/[id]/assignments/[assignmentId]` | -- | 204 |

### Grade Categories
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes/[id]/categories` | -- | `AssignmentCategory[]` |
| POST | `/api/classes/[id]/categories` | `{ name, weight }` | Created category |
| PATCH | `/api/classes/[id]/categories` | `{ id, name?, weight? }` | Updated |

### Grades
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes/[id]/grades` | -- | Full gradebook data (students, assignments, categories, grades) |
| POST | `/api/classes/[id]/grades` | `{ grades: [{ studentId, assignmentId, score, status? }] }` | Upserted grades |

**Bulk upsert:** The grades POST endpoint accepts an array of grade updates and uses `upsert` with the unique constraint `[studentId, assignmentId]`.

### Sessions
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/sessions?weekStart=YYYY-MM-DD` | -- | `{ sessions, weekStart, weekEnd }` |
| GET | `/api/sessions/[id]` | -- | Session with tasks, class, schedule, lesson |
| PATCH | `/api/sessions/[id]` | `{ notes? }` | Updated session |
| POST | `/api/sessions/[id]/tasks` | `{ title, sortOrder? }` | Created session task |
| PATCH | `/api/sessions/[id]/tasks/[taskId]` | `{ completed?, title?, sortOrder? }` | Updated task |
| DELETE | `/api/sessions/[id]/tasks/[taskId]` | -- | `{ success: true }` |

### Session Generation (`ensureSessionsForWeek`)

Sessions are lazily generated when a week is viewed. The `src/lib/sessions.ts` utility:

1. Loads all user classes with schedules and default task templates
2. Computes which (scheduleId, date) pairs should exist for Mon-Fri
3. `createMany({ skipDuplicates: true })` for new ClassSession records (idempotent via `@@unique([scheduleId, date])`)
4. For newly created sessions (zero tasks), copies `isDefault: true` templates into SessionTask records
5. Returns all sessions for the week with full includes

### Task Templates
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes/[id]/task-templates` | -- | `SessionTaskTemplate[]` |
| POST | `/api/classes/[id]/task-templates` | `{ title, sortOrder?, isDefault? }` | Created template |
| PATCH | `/api/classes/[id]/task-templates/[templateId]` | Partial fields | Updated template |
| DELETE | `/api/classes/[id]/task-templates/[templateId]` | -- | `{ success: true }` |

### Unit Plans
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/classes/[id]/unit-plans` | -- | `UnitPlanWithUnits[]` |
| POST | `/api/classes/[id]/unit-plans` | `{ name, weeks? }` | Created plan with units |
| GET | `/api/classes/[id]/unit-plans/[planId]` | -- | Plan with units/sub-units |
| DELETE | `/api/classes/[id]/unit-plans/[planId]` | -- | 204 |

Units and sub-units have their own nested CRUD routes under the plan.

### Dashboard
| Method | Route | Returns |
|--------|-------|---------|
| GET | `/api/dashboard?weekStart=YYYY-MM-DD` | `{ sessions, weekStart, weekEnd }` |

Calls `ensureSessionsForWeek()` and returns all sessions for the week. Same data as `/api/sessions` -- the dashboard route is a convenience alias.

### Calendar
| Method | Route | Returns |
|--------|-------|---------|
| GET | `/api/calendar` | All assignments with due dates + class info |

### Settings
| Method | Route | Body | Returns |
|--------|-------|------|---------|
| GET | `/api/settings` | -- | User preferences JSON |
| PATCH | `/api/settings` | `{ lessonPlanLeadDays? }` | Updated preferences |

---

## Input Validation

All validation schemas live in `src/lib/validations.ts` using **Zod**. API routes validate with:
```ts
const validation = someSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({ error: "Invalid input", details: validation.error.issues }, { status: 400 });
}
```

---

## Prisma Client Setup

`src/lib/prisma.ts` creates a singleton Prisma client using the `@prisma/adapter-pg` driver adapter (required for Prisma 7). The global singleton pattern prevents connection exhaustion during hot reload in development.

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```
