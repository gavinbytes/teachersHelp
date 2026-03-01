import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

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

    const schedules = await prisma.classSchedule.findMany({
      where: { classId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
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
    const validation = scheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const schedule = await prisma.classSchedule.create({
      data: {
        ...validation.data,
        classId: id,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
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
    const deleteSchema = z.object({
      id: z.string().min(1, "Schedule ID is required"),
    });

    const validation = deleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const scheduleId = validation.data.id;

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: scheduleId },
      select: { classId: true },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.classId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.classSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
