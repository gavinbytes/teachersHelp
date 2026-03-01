import "dotenv/config";
import { PrismaClient, AssignmentType, LessonStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.grade.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.assignmentCategory.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.sessionTask.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.sessionTaskTemplate.deleteMany();
  await prisma.class.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create teacher
  const hashedPassword = await bcrypt.hash("password123", 10);
  const teacher = await prisma.user.create({
    data: {
      name: "Ms. Johnson",
      email: "teacher@school.com",
      password: hashedPassword,
    },
  });

  // Create classes
  const algebra = await prisma.class.create({
    data: {
      name: "Algebra I",
      subject: "Mathematics",
      color: "#3b82f6",
      room: "Room 201",
      userId: teacher.id,
    },
  });

  const english = await prisma.class.create({
    data: {
      name: "English Literature",
      subject: "English",
      color: "#10b981",
      room: "Room 105",
      userId: teacher.id,
    },
  });

  const physics = await prisma.class.create({
    data: {
      name: "Physics",
      subject: "Science",
      color: "#f59e0b",
      room: "Room 302",
      userId: teacher.id,
    },
  });

  // Create schedules
  const schedules = await Promise.all([
    // Algebra: Mon/Wed/Fri 8:30-9:20
    prisma.classSchedule.create({ data: { classId: algebra.id, dayOfWeek: 1, startTime: "08:30", endTime: "09:20" } }),
    prisma.classSchedule.create({ data: { classId: algebra.id, dayOfWeek: 3, startTime: "08:30", endTime: "09:20" } }),
    prisma.classSchedule.create({ data: { classId: algebra.id, dayOfWeek: 5, startTime: "08:30", endTime: "09:20" } }),
    // English: Tue/Thu 10:00-11:15
    prisma.classSchedule.create({ data: { classId: english.id, dayOfWeek: 2, startTime: "10:00", endTime: "11:15" } }),
    prisma.classSchedule.create({ data: { classId: english.id, dayOfWeek: 4, startTime: "10:00", endTime: "11:15" } }),
    // Physics: Mon/Wed 13:00-14:15
    prisma.classSchedule.create({ data: { classId: physics.id, dayOfWeek: 1, startTime: "13:00", endTime: "14:15" } }),
    prisma.classSchedule.create({ data: { classId: physics.id, dayOfWeek: 3, startTime: "13:00", endTime: "14:15" } }),
  ]);

  // Create students for each class
  const studentNames = [
    ["Emma", "Wilson"], ["Liam", "Brown"], ["Sophia", "Davis"],
    ["Noah", "Garcia"], ["Olivia", "Martinez"], ["James", "Anderson"],
    ["Ava", "Thomas"], ["William", "Jackson"], ["Isabella", "White"],
    ["Benjamin", "Harris"],
  ];

  const algebraStudents = await Promise.all(
    studentNames.map(([firstName, lastName]) =>
      prisma.student.create({ data: { firstName, lastName, classId: algebra.id } })
    )
  );

  const englishStudents = await Promise.all(
    studentNames.slice(0, 8).map(([firstName, lastName]) =>
      prisma.student.create({ data: { firstName, lastName, classId: english.id } })
    )
  );

  const physicsStudents = await Promise.all(
    studentNames.slice(2, 9).map(([firstName, lastName]) =>
      prisma.student.create({ data: { firstName, lastName, classId: physics.id } })
    )
  );

  // Create assignment categories
  const algebraCategories = await Promise.all([
    prisma.assignmentCategory.create({ data: { name: "Homework", weight: 30, classId: algebra.id } }),
    prisma.assignmentCategory.create({ data: { name: "Quizzes", weight: 20, classId: algebra.id } }),
    prisma.assignmentCategory.create({ data: { name: "Tests", weight: 40, classId: algebra.id } }),
    prisma.assignmentCategory.create({ data: { name: "Participation", weight: 10, classId: algebra.id } }),
  ]);

  // Create assignments for Algebra
  const algebraAssignments = await Promise.all([
    prisma.assignment.create({
      data: { name: "HW 1: Linear Equations", type: AssignmentType.HOMEWORK, points: 100, classId: algebra.id, categoryId: algebraCategories[0].id, dueDate: new Date("2026-02-10") },
    }),
    prisma.assignment.create({
      data: { name: "HW 2: Quadratics", type: AssignmentType.HOMEWORK, points: 100, classId: algebra.id, categoryId: algebraCategories[0].id, dueDate: new Date("2026-02-17") },
    }),
    prisma.assignment.create({
      data: { name: "Quiz 1: Basics", type: AssignmentType.QUIZ, points: 50, classId: algebra.id, categoryId: algebraCategories[1].id, dueDate: new Date("2026-02-12") },
    }),
    prisma.assignment.create({
      data: { name: "Test 1: Unit 1", type: AssignmentType.TEST, points: 100, classId: algebra.id, categoryId: algebraCategories[2].id, dueDate: new Date("2026-02-28") },
    }),
  ]);

  // Create grades for Algebra students
  for (const student of algebraStudents) {
    for (const assignment of algebraAssignments) {
      const maxScore = assignment.points;
      const score = Math.round((0.6 + Math.random() * 0.4) * maxScore);
      await prisma.grade.create({
        data: {
          score,
          status: "GRADED",
          studentId: student.id,
          assignmentId: assignment.id,
        },
      });
    }
  }

  // Create lessons
  await Promise.all([
    prisma.lesson.create({
      data: { title: "Linear Equations Review", content: "Review solving linear equations with one variable", date: new Date("2026-02-24"), status: LessonStatus.PLANNED, classId: algebra.id, scheduleId: schedules[0].id },
    }),
    prisma.lesson.create({
      data: { title: "Quadratic Formula", content: "Introduce the quadratic formula and practice problems", date: new Date("2026-02-26"), status: LessonStatus.DRAFT, classId: algebra.id, scheduleId: schedules[1].id },
    }),
    prisma.lesson.create({
      data: { title: "Shakespeare Intro", content: "Introduction to Romeo and Juliet", date: new Date("2026-02-25"), status: LessonStatus.PLANNED, classId: english.id, scheduleId: schedules[3].id },
    }),
  ]);

  // Create session task templates
  await Promise.all([
    prisma.sessionTaskTemplate.create({ data: { title: "Take attendance", sortOrder: 0, classId: algebra.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Review homework", sortOrder: 1, classId: algebra.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Collect assignments", sortOrder: 2, classId: algebra.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Take attendance", sortOrder: 0, classId: english.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Discussion prep", sortOrder: 1, classId: english.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Take attendance", sortOrder: 0, classId: physics.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Lab setup", sortOrder: 1, classId: physics.id, isDefault: true } }),
    prisma.sessionTaskTemplate.create({ data: { title: "Safety check", sortOrder: 2, classId: physics.id, isDefault: true } }),
  ]);

  console.log("Seed data created successfully!");
  console.log(`Teacher: ${teacher.email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
