import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subject: z.string().min(1, "Subject is required"),
  color: z.string().default("#3b82f6"),
  room: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const studentSchema = z.object({
  student_name: z.string().min(1, "Student name is required"),
  email: z.string().email().optional().or(z.literal("")),
});

export function parseStudentName(name: string): { firstName: string; lastName: string } {
  const idx = name.indexOf(" ");
  if (idx === -1) return { firstName: name, lastName: "" };
  return { firstName: name.slice(0, idx), lastName: name.slice(idx + 1) };
}

export const assignmentSchema = z.object({
  name: z.string().min(1, "Assignment name is required"),
  type: z.enum(["HOMEWORK", "QUIZ", "TEST", "PROJECT", "PARTICIPATION", "OTHER"]),
  points: z.number().positive("Points must be positive"),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  weight: z.number().min(0).max(100),
});

export const gradeUpdateSchema = z.object({
  grades: z.array(
    z.object({
      studentId: z.string(),
      assignmentId: z.string(),
      score: z.number().nullable(),
      status: z.enum(["GRADED", "MISSING", "EXCUSED", "LATE"]).optional(),
    })
  ),
});

export const sessionTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  sortOrder: z.number().min(0).optional(),
});

export const sessionTaskToggleSchema = z.object({
  completed: z.boolean(),
});

export const sessionTaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  sortOrder: z.number().min(0).optional(),
});

export const sessionTaskTemplateSchema = z.object({
  title: z.string().min(1, "Template title is required"),
  sortOrder: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const sessionNotesSchema = z.object({
  notes: z.string().optional(),
});

export const settingsSchema = z.object({
  lessonPlanLeadDays: z.number().min(1).max(14).optional(),
});

export const unitPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  weeks: z.number().min(1).max(52).optional(),
});

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  startWeek: z.number().min(1),
  endWeek: z.number().min(1),
  sortOrder: z.number().min(0),
});

export const subUnitSchema = z.object({
  name: z.string().min(1, "Sub-unit name is required"),
  sortOrder: z.number().min(0),
  status: z.enum(["PLANNED", "TAUGHT", "SKIPPED"]).optional(),
});
