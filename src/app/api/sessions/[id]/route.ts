import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionNotesSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        class: true,
        schedule: true,
        lesson: true,
        tasks: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (classSession.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(classSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
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

  const { id } = await params;

  try {
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: { class: { select: { userId: true } } },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (classSession.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = sessionNotesSchema.parse(body);

    const updated = await prisma.classSession.update({
      where: { id },
      data: { notes: data.notes ?? null },
      include: {
        class: true,
        schedule: true,
        lesson: true,
        tasks: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating session:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
