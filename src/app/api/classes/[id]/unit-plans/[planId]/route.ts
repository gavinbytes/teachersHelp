import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitPlanSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function verifyAccess(classId: string, planId: string, userId: string) {
  const plan = await prisma.unitPlan.findUnique({
    where: { id: planId },
    include: { class: { select: { userId: true } } },
  });
  if (!plan || plan.classId !== classId || plan.class.userId !== userId) return null;
  return plan;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, planId } = await params;

  try {
    const plan = await verifyAccess(id, planId, session.user.id);
    if (!plan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fullPlan = await prisma.unitPlan.findUnique({
      where: { id: planId },
      include: {
        units: {
          orderBy: [{ weekNumber: "asc" }, { sortOrder: "asc" }],
          include: {
            subUnits: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(fullPlan);
  } catch (error) {
    console.error("Error fetching unit plan:", error);
    return NextResponse.json({ error: "Failed to fetch unit plan" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, planId } = await params;

  try {
    const plan = await verifyAccess(id, planId, session.user.id);
    if (!plan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = unitPlanSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.unitPlan.update({
      where: { id: planId },
      data: { name: validation.data.name },
      include: {
        units: {
          orderBy: [{ weekNumber: "asc" }, { sortOrder: "asc" }],
          include: { subUnits: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating unit plan:", error);
    return NextResponse.json({ error: "Failed to update unit plan" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, planId } = await params;

  try {
    const plan = await verifyAccess(id, planId, session.user.id);
    if (!plan) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.unitPlan.delete({ where: { id: planId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting unit plan:", error);
    return NextResponse.json({ error: "Failed to delete unit plan" }, { status: 500 });
  }
}
