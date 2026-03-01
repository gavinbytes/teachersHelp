import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id, assignmentId } = await params;

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

    // Verify assignment belongs to class
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        classId: id,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = assignmentSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(validation.data.name && { name: validation.data.name }),
        ...(validation.data.type && { type: validation.data.type }),
        ...(validation.data.points !== undefined && { points: validation.data.points }),
        ...(validation.data.dueDate !== undefined && {
          dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null,
        }),
        ...(validation.data.categoryId !== undefined && {
          categoryId: validation.data.categoryId || null,
        }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id, assignmentId } = await params;

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

    // Verify assignment belongs to class
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        classId: id,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete assignment (cascade will delete grades)
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
