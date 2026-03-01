import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionTaskUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await params;

  try {
    // Verify task belongs to session and user owns it
    const task = await prisma.sessionTask.findUnique({
      where: { id: taskId },
      include: {
        classSession: {
          include: { class: { select: { userId: true } } },
        },
      },
    });

    if (!task || task.classSessionId !== id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.classSession.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = sessionTaskUpdateSchema.parse(body);

    const updated = await prisma.sessionTask.update({
      where: { id: taskId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating session task:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await params;

  try {
    const task = await prisma.sessionTask.findUnique({
      where: { id: taskId },
      include: {
        classSession: {
          include: { class: { select: { userId: true } } },
        },
      },
    });

    if (!task || task.classSessionId !== id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.classSession.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.sessionTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
