import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentSchema, parseStudentName } from "@/lib/validations";
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

  const { id } = await params;

  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: { classId: id },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Batch creation: if `count` is provided, create placeholder students
    if (typeof body.count === "number" && body.count > 0) {
      const count = Math.min(body.count, 50);
      const students = await prisma.student.createMany({
        data: Array.from({ length: count }, (_, i) => ({
          firstName: "Student",
          lastName: String(i + 1),
          classId: id,
        })),
      });
      return NextResponse.json({ created: students.count }, { status: 201 });
    }

    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { student_name, ...rest } = validation.data;
    const { firstName, lastName } = parseStudentName(student_name);
    const student = await prisma.student.create({
      data: {
        ...rest,
        firstName,
        lastName,
        classId: id,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
