import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentSchema, parseStudentName } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id, studentId } = await params;

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

    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (existingStudent.classId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = studentSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { student_name, ...rest } = validation.data;
    const nameFields = student_name ? parseStudentName(student_name) : {};
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { ...rest, ...nameFields },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id, studentId } = await params;

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

    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (existingStudent.classId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.student.delete({
      where: { id: studentId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
