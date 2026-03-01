import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validations";
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
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const assignments = await prisma.assignment.findMany({
      where: { classId: id },
      include: {
        category: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
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
    const validation = assignmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        name: validation.data.name,
        type: validation.data.type,
        points: validation.data.points,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null,
        categoryId: validation.data.categoryId || null,
        classId: id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
