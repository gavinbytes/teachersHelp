import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subUnitSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string; unitId: string; subUnitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subUnitId } = await params;

  try {
    const subUnit = await prisma.subUnit.findUnique({
      where: { id: subUnitId },
      include: {
        unit: {
          include: { unitPlan: { include: { class: { select: { userId: true } } } } },
        },
      },
    });

    if (!subUnit || subUnit.unit.unitPlan.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = subUnitSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.subUnit.update({
      where: { id: subUnitId },
      data: validation.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sub-unit:", error);
    return NextResponse.json({ error: "Failed to update sub-unit" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; planId: string; unitId: string; subUnitId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subUnitId } = await params;

  try {
    const subUnit = await prisma.subUnit.findUnique({
      where: { id: subUnitId },
      include: {
        unit: {
          include: { unitPlan: { include: { class: { select: { userId: true } } } } },
        },
      },
    });

    if (!subUnit || subUnit.unit.unitPlan.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.subUnit.delete({ where: { id: subUnitId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sub-unit:", error);
    return NextResponse.json({ error: "Failed to delete sub-unit" }, { status: 500 });
  }
}
