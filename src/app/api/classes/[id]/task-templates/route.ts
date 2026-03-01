import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionTaskTemplateSchema } from "@/lib/validations";
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

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (cls.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = await prisma.sessionTaskTemplate.findMany({
      where: { classId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching task templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
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

  const { id } = await params;

  try {
    const cls = await prisma.class.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (cls.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = sessionTaskTemplateSchema.parse(body);

    // Get max sortOrder
    const maxSort = await prisma.sessionTaskTemplate.findFirst({
      where: { classId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const template = await prisma.sessionTaskTemplate.create({
      data: {
        title: data.title,
        sortOrder: data.sortOrder ?? (maxSort ? maxSort.sortOrder + 1 : 0),
        isDefault: data.isDefault ?? true,
        classId: id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task template:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
