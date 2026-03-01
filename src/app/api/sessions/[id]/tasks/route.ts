import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionTaskSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify session belongs to user
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        class: { select: { userId: true } },
        tasks: { orderBy: { sortOrder: "desc" }, take: 1 },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (classSession.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = sessionTaskSchema.parse(body);

    const maxSortOrder = classSession.tasks[0]?.sortOrder ?? -1;

    const task = await prisma.sessionTask.create({
      data: {
        title: data.title,
        sortOrder: data.sortOrder ?? maxSortOrder + 1,
        classSessionId: id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Error creating session task:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
