import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

const categoryWeightUpdateSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      weight: z.number().min(0).max(100),
    })
  ),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id } = await params;

    // Verify class belongs to user
    const classData = await prisma.class.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const categories = await prisma.assignmentCategory.findMany({
      where: { classId: id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
  const userId = session.user.id;

  try {
    const { id } = await params;

    // Verify class belongs to user
    const classData = await prisma.class.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const newCategory = await prisma.assignmentCategory.create({
      data: {
        name: validation.data.name,
        weight: validation.data.weight,
        classId: id,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id } = await params;

    // Verify class belongs to user
    const classData = await prisma.class.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = categoryWeightUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Validate weights sum to 100
    const totalWeight = validation.data.categories.reduce(
      (sum, cat) => sum + cat.weight,
      0
    );

    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        { error: "Category weights must sum to 100" },
        { status: 400 }
      );
    }

    // Batch update category weights
    const updatePromises = validation.data.categories.map((category) =>
      prisma.assignmentCategory.update({
        where: { id: category.id },
        data: { weight: category.weight },
      })
    );

    const updatedCategories = await prisma.$transaction(updatePromises);

    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error("Error updating category weights:", error);
    return NextResponse.json(
      { error: "Failed to update category weights" },
      { status: 500 }
    );
  }
}
