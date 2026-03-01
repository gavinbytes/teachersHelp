import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Get all classes with their assignments
    const classes = await prisma.class.findMany({
      where: { userId },
      include: {
        assignments: {
          where: {
            dueDate: {
              not: null,
            },
          },
          include: {
            category: true,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    // Flatten assignments with class info
    const assignments = classes.flatMap((cls) =>
      cls.assignments.map((assignment) => ({
        ...assignment,
        class: {
          id: cls.id,
          name: cls.name,
          color: cls.color,
          subject: cls.subject,
        },
      }))
    );

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
