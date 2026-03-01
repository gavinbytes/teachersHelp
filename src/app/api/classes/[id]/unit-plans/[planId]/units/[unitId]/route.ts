import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string; unitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { unitPlan: { include: { class: { select: { userId: true } } } } },
    });

    if (!unit || unit.unitPlan.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = unitSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.unit.update({
      where: { id: unitId },
      data: validation.data,
      include: { subUnits: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string; unitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { unitPlan: { include: { class: { select: { userId: true } } } } },
    });

    if (!unit || unit.unitPlan.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.unit.delete({ where: { id: unitId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
