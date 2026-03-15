import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twoWeeksOut = new Date(now);
    twoWeeksOut.setDate(now.getDate() + 14);

    const assignments = await prisma.assignment.findMany({
      where: {
        class: { userId: session.user.id },
        dueDate: {
          gte: now,
          lte: twoWeeksOut,
        },
      },
      include: {
        class: { select: { id: true, name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    return NextResponse.json(
      { error: "Failed to fetch deadlines" },
      { status: 500 }
    );
  }
}
