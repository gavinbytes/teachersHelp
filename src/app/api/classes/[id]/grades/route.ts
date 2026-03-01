import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id } = await params;

    // Verify class belongs to user
    const classData = await prisma.class.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        students: {
          orderBy: { lastName: "asc" },
        },
        assignments: {
          include: {
            category: true,
          },
          orderBy: { createdAt: "asc" },
        },
        categories: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Fetch all grades for students and assignments in this class
    const grades = await prisma.grade.findMany({
      where: {
        studentId: {
          in: classData.students.map((s) => s.id),
        },
        assignmentId: {
          in: classData.assignments.map((a) => a.id),
        },
      },
    });

    const { students, assignments, categories, ...classInfo } = classData;
    return NextResponse.json({
      classInfo,
      students,
      assignments,
      categories,
      grades,
    });
  } catch (error) {
    console.error("Error fetching gradebook data:", error);
    return NextResponse.json(
      { error: "Failed to fetch gradebook data" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id } = await params;

    // Verify class belongs to user
    const classData = await prisma.class.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = gradeUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Batch upsert grades
    const upsertPromises = validation.data.grades.map((grade) =>
      prisma.grade.upsert({
        where: {
          studentId_assignmentId: {
            studentId: grade.studentId,
            assignmentId: grade.assignmentId,
          },
        },
        update: {
          score: grade.score,
          status: grade.status || "GRADED",
        },
        create: {
          studentId: grade.studentId,
          assignmentId: grade.assignmentId,
          score: grade.score,
          status: grade.status || "GRADED",
        },
      })
    );

    const updatedGrades = await prisma.$transaction(upsertPromises);

    return NextResponse.json(updatedGrades);
  } catch (error) {
    console.error("Error updating grades:", error);
    return NextResponse.json(
      { error: "Failed to update grades" },
      { status: 500 }
    );
  }
}
