import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const classes = await prisma.class.findMany({
      where: { userId },
      include: {
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const validation = classSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const schedules = body.schedules as { dayOfWeek: number; startTime: string; endTime: string }[] | undefined;

    const { startDate, endDate, ...classData } = validation.data;

    const newClass = await prisma.class.create({
      data: {
        ...classData,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        userId,
        ...(schedules && schedules.length > 0
          ? {
              schedules: {
                create: schedules.map((s) => ({
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                })),
              },
            }
          : {}),
      },
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

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create class", details: message },
      { status: 500 }
    );
  }
}
