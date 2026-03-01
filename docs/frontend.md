# Frontend Architecture

## Provider Stack

The root layout (`src/app/layout.tsx`) wraps everything in three layers:

```
<SessionProvider>          // NextAuth session context (client-side)
  <QueryProvider>          // TanStack Query client (staleTime: 60s, no refetchOnWindowFocus)
    <AppShell>             // Layout: sidebar + main content area
      {children}           // Page content
    </AppShell>
    <Toaster />            // Sonner toast notifications (bottom-right)
  </QueryProvider>
</SessionProvider>
```

`AppShell` (`src/components/layout/AppShell.tsx`) checks the pathname -- auth pages (`/login`, `/register`) render without the sidebar. Everything else gets the sidebar + scrollable main area.

---

## Routing (App Router)

All pages are **client components** (no server-side data fetching). Pages are thin wrappers that delegate to `*Client` components.

| Route | Page Component | Key Client Component |
|-------|---------------|---------------------|
| `/` | `page.tsx` | `DashboardClient` |
| `/classes` | `page.tsx` | `ClassListClient` |
| `/classes/[id]` | `page.tsx` | Direct (class detail) |
| `/classes/[id]/gradebook` | `page.tsx` | `GradebookClient` |
| `/classes/[id]/students` | `page.tsx` | Inline (uses hooks directly) |
| `/classes/[id]/unit-plans` | `page.tsx` | `UnitPlanClient` |
| `/calendar` | `page.tsx` | `CalendarView` |
| `/tasks` | `page.tsx` | Inline (flat session task list with filters) |
| `/settings` | `page.tsx` | `SettingsClient` |

**Dynamic route params:** Next.js 16 passes `params` as a `Promise`. Pages use `use(params)` to unwrap:
```tsx
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
```

---

## State Management

### TanStack Query (server state)

All server data flows through custom hooks in `src/hooks/`. Each hook file covers one domain:

| File | Queries | Mutations |
|------|---------|-----------|
| `useClasses.ts` | `useClasses`, `useClass(id)` | `useCreateClass`, `useUpdateClass`, `useDeleteClass`, `useAddSchedule`, `useDeleteSchedule` |
| `useStudents.ts` | `useStudents(classId)` | `useAddStudent`, `useUpdateStudent`, `useDeleteStudent` |
| `useGradebook.ts` | `useGradebook(classId)` | `useUpdateGrades`, `useCreateAssignment`, `useDeleteAssignment`, `useUpdateCategory`, `useCreateCategory` |
| `useSessions.ts` | `useWeekSessions(weekStart)` | `useToggleSessionTask`, `useAddSessionTask`, `useDeleteSessionTask` |
| `useTaskTemplates.ts` | `useTaskTemplates(classId)` | `useCreateTaskTemplate`, `useUpdateTaskTemplate`, `useDeleteTaskTemplate` |
| `useUnitPlans.ts` | `useUnitPlans(classId)`, `useUnitPlan(classId, planId)` | CRUD for plans, units, sub-units |
| `useSettings.ts` | `useSettings` | `useUpdateSettings` |

**Query key conventions:**
```
["classes"]                    -- all classes
["classes", classId]           -- single class with details
["students", classId]          -- students in a class
["gradebook", classId]         -- full gradebook data
["sessions", { weekStart }]    -- sessions for a week (dashboard + tasks page)
["task-templates", classId]    -- task templates for a class
["calendar-assignments"]       -- all assignments with due dates
["settings"]                   -- user preferences
["unit-plans", classId]        -- unit plans for a class
```

**Cache invalidation pattern:** Mutations invalidate parent + related keys. For example, `useAddStudent` invalidates both `["students", classId]` and `["classes"]` (because class cards show student count).

### Local component state

Everything else (form inputs, toggle states, edit modes) is plain `useState` inside components.

---

## Component Patterns

### Collapsible Sidebar Sections
The sidebar (`Sidebar.tsx`) has expandable sections for Gradebook and Unit Plans. Pattern:
```tsx
const [expanded, setExpanded] = useState(false);
const isActive = pathname.includes("/gradebook");
const shouldExpand = expanded || isActive;  // auto-expand when on route
```

### Inline Editing (Students)
`InlineStudentName` in `students/page.tsx`:
- Default: renders a `<button>` with text
- Click: swaps to `<Input>` with current value
- Save: on `blur` or `Enter` key
- Cancel: on `Escape` key

### AG Grid (Gradebook)
`GradeGrid.tsx` uses AG Grid Community for the spreadsheet:
- Rows = students, Columns = assignments (grouped by category) + calculated Avg% + Letter
- Editable cells for grade entry
- `onCellValueChanged` collects updates and **debounces** (500ms) before sending batch PATCH
- Color-coded cells: green (A), blue (B), yellow (C), red (D/F), amber (missing)

### Calendar Views
`CalendarView.tsx` has three modes toggled by segmented buttons:
- **Monthly**: 7-column grid (Sun-Sat), shows class dots + assignment badges
- **Weekly**: 5-column grid (Mon-Fri), shows class sessions with times + due assignments
- **Daily**: single-day detail view with full class session info + due assignments

---

## UI Library

- **shadcn/ui** components in `src/components/ui/` -- do not edit directly (regenerate with `npx shadcn@latest add <component>`)
- **Tailwind 4** with `tw-animate-css` for animations
- **lucide-react** for all icons
- **sonner** for toast notifications
- **date-fns** for all date manipulation
- **react-day-picker** for the date picker calendar widget
- **dnd-kit** for drag-and-drop interactions
