import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionTaskTemplateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, templateId } = await params;

  try {
    const template = await prisma.sessionTaskTemplate.findUnique({
      where: { id: templateId },
      include: { class: { select: { userId: true } } },
    });

    if (!template || template.classId !== id) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = sessionTaskTemplateSchema.partial().parse(body);

    const updated = await prisma.sessionTaskTemplate.update({
      where: { id: templateId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating template:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, templateId } = await params;

  try {
    const template = await prisma.sessionTaskTemplate.findUnique({
      where: { id: templateId },
      include: { class: { select: { userId: true } } },
    });

    if (!template || template.classId !== id) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.class.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.sessionTaskTemplate.delete({ where: { id: templateId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
