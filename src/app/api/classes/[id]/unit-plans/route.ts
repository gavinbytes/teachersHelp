import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitPlanSchema } from "@/lib/validations";
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
    const cls = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cls || cls.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plans = await prisma.unitPlan.findMany({
      where: { classId: id },
      include: {
        units: {
          orderBy: [{ startWeek: "asc" }, { sortOrder: "asc" }],
          include: {
            subUnits: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching unit plans:", error);
    return NextResponse.json({ error: "Failed to fetch unit plans" }, { status: 500 });
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

  const { id } = await params;

  try {
    const cls = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cls || cls.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = unitPlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const plan = await prisma.unitPlan.create({
      data: {
        name: validation.data.name,
        totalWeeks: validation.data.weeks ?? 18,
        classId: id,
      },
      include: {
        units: {
          include: { subUnits: true },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating unit plan:", error);
    return NextResponse.json({ error: "Failed to create unit plan" }, { status: 500 });
  }
}
