import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subUnitSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(
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
    const validation = subUnitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const subUnit = await prisma.subUnit.create({
      data: {
        ...validation.data,
        unitId,
      },
    });

    return NextResponse.json(subUnit, { status: 201 });
  } catch (error) {
    console.error("Error creating sub-unit:", error);
    return NextResponse.json({ error: "Failed to create sub-unit" }, { status: 500 });
  }
}
