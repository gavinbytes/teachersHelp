# Database Schema

PostgreSQL via Prisma 7. Schema file: `prisma/schema.prisma`.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Class : "owns"
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"

    Class ||--o{ ClassSchedule : "has"
    Class ||--o{ Student : "has"
    Class ||--o{ Assignment : "has"
    Class ||--o{ AssignmentCategory : "has"
    Class ||--o{ Lesson : "has"
    Class ||--o{ UnitPlan : "has"
    Class ||--o{ ClassSession : "has"
    Class ||--o{ SessionTaskTemplate : "has"

    ClassSchedule ||--o{ Lesson : "scheduled in"
    ClassSchedule ||--o{ ClassSession : "generates"

    ClassSession ||--o{ SessionTask : "has"
    ClassSession ||--o| Lesson : "linked to"

    SessionTaskTemplate ||--o{ SessionTask : "creates"

    Student ||--o{ Grade : "receives"
    Assignment ||--o{ Grade : "graded by"
    AssignmentCategory ||--o{ Assignment : "groups"

    UnitPlan ||--o{ Unit : "contains"
    Unit ||--o{ SubUnit : "contains"
```

---

## Models

### Auth Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Teacher account | `email` (unique), `password` (bcrypt), `preferences` (JSON) |
| **Account** | OAuth accounts (NextAuth) | `provider`, `providerAccountId` |
| **Session** | Active sessions (NextAuth) | `sessionToken`, `expires` |
| **VerificationToken** | Email verification | `identifier`, `token` |

### Core App Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Class** | A course/section | `name`, `subject`, `color`, `room`, `startDate`, `endDate` |
| **ClassSchedule** | Recurring time slots | `dayOfWeek` (0-6), `startTime` ("HH:MM"), `endTime` ("HH:MM") |
| **Student** | A student in a class | `firstName`, `lastName`, `email?` |
| **Lesson** | A lesson plan | `title`, `content`, `date`, `status` (DRAFT/PLANNED/COMPLETED), `classSessionId?` |

### Class Session Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **ClassSession** | A specific meeting of a class on a date | `date`, `classId`, `scheduleId`, `notes?` |
| **SessionTask** | A checklist item tied to a session | `title`, `completed`, `sortOrder`, `classSessionId`, `templateId?` |
| **SessionTaskTemplate** | Reusable per-class task blueprint | `title`, `sortOrder`, `classId`, `isDefault` |

**ClassSession uniqueness:** `@@unique([scheduleId, date])` -- one session per schedule slot per date. Enables idempotent creation via `createMany({ skipDuplicates: true })`.

**Session generation:** Sessions are lazily created when a week is viewed. The `ensureSessionsForWeek()` utility in `src/lib/sessions.ts` creates missing sessions and copies `isDefault: true` templates into new sessions as `SessionTask` records.

### Grading Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **AssignmentCategory** | Grade weight bucket | `name`, `weight` (% of total, should sum to 100) |
| **Assignment** | A graded item | `name`, `type` (enum), `points`, `dueDate?`, `categoryId?` |
| **Grade** | A student's score | `score?`, `status` (GRADED/MISSING/EXCUSED/LATE) |

**Grade uniqueness:** `@@unique([studentId, assignmentId])` -- one grade per student per assignment. The API uses `upsert` to handle both create and update.

### Unit Plan Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **UnitPlan** | A curriculum plan for a class | `name` |
| **Unit** | A week/section within a plan | `name`, `weekNumber`, `sortOrder` |
| **SubUnit** | A lesson/topic within a unit | `name`, `sortOrder`, `status` (PLANNED/TAUGHT/SKIPPED) |

---

## Cascade Deletes

All child models use `onDelete: Cascade` on their parent foreign key. Deleting a class removes all its schedules, students, assignments, grades, lessons, sessions, session tasks, task templates, and unit plans.

Exceptions:
- `Lesson.scheduleId` uses `onDelete: SetNull` -- deleting a schedule slot doesn't delete lessons, just unlinks them.
- `Lesson.classSessionId` uses `onDelete: SetNull` -- deleting a session doesn't delete the lesson.
- `SessionTask.templateId` uses `onDelete: SetNull` -- deleting a template doesn't delete tasks already created from it.

---

## Enums

```
AssignmentType: HOMEWORK | QUIZ | TEST | PROJECT | PARTICIPATION | OTHER
GradeStatus:    GRADED | MISSING | EXCUSED | LATE
LessonStatus:   DRAFT | PLANNED | COMPLETED
SubUnitStatus:  PLANNED | TAUGHT | SKIPPED
```

---

## Indexes

Every model with a `userId` or `classId` foreign key has an `@@index` on it. Additional indexes:
- `ClassSession`: `@@index([date])`
- `SessionTask`: `@@index([classSessionId])`
- `SessionTaskTemplate`: `@@index([classId])`
- `Lesson`: `@@index([date])`
- `Grade`: `@@index([assignmentId])`

---

## Data Isolation

All top-level queries filter by `userId`. There are no cross-user queries. The ownership chain is:

```
User -> Class -> [Students, Schedules, Assignments, Categories, Lessons, UnitPlans]
User -> Class -> ClassSession -> SessionTask
User -> Class -> SessionTaskTemplate
```

For nested resources (e.g., `/api/sessions/[id]/tasks`), the API first verifies `classSession.class.userId === session.user.id` before proceeding.
