# Gotchas & Refactoring Notes

Things that will bite you if you're not aware.

---

## 1. `dayOfWeek` Numbering

`ClassSchedule.dayOfWeek` uses JavaScript's `Date.getDay()` convention:
- **0 = Sunday, 1 = Monday, ..., 6 = Saturday**

The `WEEKDAYS` array in `ClassForm.tsx` only offers 1-5 (Mon-Fri), but the database supports 0-6. The session generation utility (`src/lib/sessions.ts`) skips weekend days (0 and 6).

**Files that depend on this:**
- `src/components/calendar/CalendarView.tsx` -- `getDay(day)` matching
- `src/lib/sessions.ts` -- filters `schedule.dayOfWeek` to 1-5
- `src/components/classes/ClassForm.tsx` -- `WEEKDAYS` array
- `src/lib/utils.ts` -- `dayNames` array indexed 0-6

---

## 2. Student Name Handling

The API uses a **single `student_name` field** that gets split by `parseStudentName()`:
- `"Jane Doe"` -> `{ firstName: "Jane", lastName: "Doe" }`
- `"Jane"` -> `{ firstName: "Jane", lastName: "" }`
- `"Jane Marie Doe"` -> `{ firstName: "Jane", lastName: "Marie Doe" }`

The split is on the **first space only**. This means:
- Single names are allowed (lastName will be empty)
- Multi-part last names work correctly

**If you change student name handling**, update these files:
- `src/lib/validations.ts` -- `studentSchema` and `parseStudentName()`
- `src/hooks/useStudents.ts` -- `useAddStudent`, `useUpdateStudent` (send `student_name`)
- `src/components/students/QuickStudentEntry.tsx` -- sends `student_name`
- `src/app/classes/[id]/students/page.tsx` -- `InlineStudentName` sends `student_name`
- `src/app/api/classes/[id]/students/route.ts` -- parses `student_name`
- `src/app/api/classes/[id]/students/[studentId]/route.ts` -- PATCH also parses it

---

## 3. Grade Debouncing in AG Grid

`GradeGrid.tsx` collects grade changes and **debounces for 500ms** before sending. If the user edits multiple cells quickly, they all batch into one API call. But:

- If the component unmounts before the debounce fires, **unsaved changes are lost**
- There's no dirty-state indicator shown to the user
- The `pendingUpdates` ref is not cleared on data refetch, only on flush

If you add navigation guards or "unsaved changes" warnings, you'll need to check `pendingUpdates.current.length > 0`.

---

## 4. Session Generation & Template Behavior

Sessions are **lazily generated** when a week is viewed (dashboard or `/api/sessions` endpoint). The `ensureSessionsForWeek()` utility handles this idempotently:

- Uses `createMany({ skipDuplicates: true })` with `@@unique([scheduleId, date])` to prevent duplicates
- Concurrent requests are safe due to the unique constraint
- Default task templates (`isDefault: true`) are only copied into **newly created** sessions (sessions with zero tasks)

**Template retroactivity:** Adding a new template does NOT add tasks to already-generated sessions. Only future sessions created after the template is added will get it. The UI communicates this to users.

**Date normalization:** Session `date` is stored as start-of-day UTC for the unique constraint to work consistently.

---

## 5. `preferences` is Untyped JSON

`User.preferences` is a `Json` field (`@default("{}")`). The app currently only stores `lessonPlanLeadDays: number`. The API reads it as:
```ts
const prefs = (user?.preferences as Record<string, unknown>) ?? {};
const leadDays = typeof prefs.lessonPlanLeadDays === "number" ? prefs.lessonPlanLeadDays : 3;
```

There's no migration needed to add new preference keys -- just start reading/writing them. But there's also no validation on read, so always use defensive defaults.

---

## 6. Middleware vs. auth()

**Two layers of auth exist:**

1. `middleware.ts` -- checks if the session **cookie exists** (fast, no DB call). Redirects to `/login` if missing.
2. `auth()` in API routes -- **verifies the JWT** and extracts `user.id`. Returns null if invalid.

The middleware only checks cookie presence, not validity. An expired/forged cookie passes middleware but fails `auth()`. This is intentional -- middleware runs on every request and needs to be fast.

**Public routes** excluded from middleware: `/login`, `/register`, `/api/auth/*`, `/api/register`.

---

## 7. No SSR / No Server Components with Data

All pages are client components. Data fetching happens exclusively via TanStack Query on the client side. This means:
- No `getServerSideProps` / `getStaticProps` patterns
- No React Server Components fetching data
- All pages show loading skeletons while data loads
- SEO is not a concern (this is a logged-in app)

If you need to add SSR data fetching, you'd need to restructure the page to have a server component wrapper that prefetches and passes data to the client component.

---

## 8. `params` is a Promise in Next.js 16

Dynamic route params changed in Next.js 15+. They're now a `Promise`:
```tsx
// Correct (Next.js 16):
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

// Wrong (will cause TypeScript error):
export default function Page({ params }: { params: { id: string } }) {
```

Same applies to API routes:
```ts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

---

## 9. Category Weights

`AssignmentCategory.weight` values should sum to 100 per class, but **this is not enforced by the database**. The `GradeGrid` calculates weighted averages based on whatever weights exist. If weights don't sum to 100, the average will still be calculated proportionally (divides by total weight used, not 100).

---

## 10. Cascade Delete Chain

Deleting a class cascades through:
```
Class -> ClassSchedule -> ClassSession -> SessionTask
Class -> ClassSchedule -> (Lesson.scheduleId set null)
Class -> ClassSession -> (Lesson.classSessionId set null)
Class -> SessionTaskTemplate -> (SessionTask.templateId set null)
Class -> Student -> Grade
Class -> Assignment -> Grade
Class -> AssignmentCategory -> (Assignment.categoryId set null)
Class -> Lesson
Class -> UnitPlan -> Unit -> SubUnit
```

This is a lot of data. There's no soft delete. No "are you sure?" confirmation beyond the browser `confirm()` dialog. If you need an undo feature, you'll need to implement soft deletes.

---

## Quick Reference: Adding a New Feature

### New page
1. Create `src/app/your-route/page.tsx` (client component)
2. Add link in `Sidebar.tsx`

### New API endpoint
1. Create `src/app/api/your-route/route.ts`
2. Start with auth check boilerplate
3. Add Zod schema to `src/lib/validations.ts`

### New data model
1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration`
3. Create hook file `src/hooks/useYourModel.ts`
4. Create API route(s)
5. Add TypeScript types to `src/types/index.ts`

### New class sub-resource
1. API: `src/app/api/classes/[id]/your-resource/route.ts`
2. Hook: add to existing `src/hooks/useClasses.ts` or create new hook file
3. Page: `src/app/classes/[id]/your-resource/page.tsx`
4. Sidebar: add link if needed (follow Gradebook/Unit Plans pattern)
