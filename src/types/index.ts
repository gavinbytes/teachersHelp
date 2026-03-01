import type {
  Class,
  ClassSchedule,
  Student,
  Assignment,
  AssignmentCategory,
  Grade,
  Lesson,
  UnitPlan,
  Unit,
  SubUnit,
  ClassSession,
  SessionTask,
  SessionTaskTemplate,
} from "@prisma/client";

export type ClassWithSchedule = Class & {
  schedules: ClassSchedule[];
  _count?: {
    students: number;
    assignments: number;
  };
};

export type ClassWithDetails = Class & {
  schedules: ClassSchedule[];
  students: Student[];
  categories: AssignmentCategory[];
  assignments: (Assignment & { category: AssignmentCategory | null })[];
};

export type GradebookData = {
  classInfo: Class;
  students: Student[];
  assignments: (Assignment & { category: AssignmentCategory | null })[];
  categories: AssignmentCategory[];
  grades: Grade[];
};

export type GradeUpdate = {
  studentId: string;
  assignmentId: string;
  score: number | null;
  status?: string;
};

export type UnitPlanWithUnits = UnitPlan & {
  units: (Unit & {
    subUnits: SubUnit[];
  })[];
};

export type UserPreferences = {
  lessonPlanLeadDays?: number;
};

export type ClassSessionWithDetails = ClassSession & {
  class: Class;
  schedule: ClassSchedule;
  lesson: Lesson | null;
  tasks: SessionTask[];
};

export type WeekSessionsData = {
  sessions: ClassSessionWithDetails[];
  weekStart: string;
  weekEnd: string;
};

export { type Class, type ClassSchedule, type Student, type Assignment, type AssignmentCategory, type Grade, type Lesson, type UnitPlan, type Unit, type SubUnit, type ClassSession, type SessionTask, type SessionTaskTemplate } from "@prisma/client";
export { AssignmentType, GradeStatus, LessonStatus, SubUnitStatus } from "@prisma/client";
