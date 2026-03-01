import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classSchema } from "@/lib/validations";
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
      include: {
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
        students: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
        categories: {
          orderBy: { name: "asc" },
        },
        assignments: {
          orderBy: { dueDate: "desc" },
          include: {
            category: true,
            _count: {
              select: { grades: true },
            },
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
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

  const { id } = await params;

  try {
    const existingClass = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (existingClass.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = classSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { startDate, endDate, ...rest } = validation.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        schedules: true,
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existingClass = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (existingClass.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
