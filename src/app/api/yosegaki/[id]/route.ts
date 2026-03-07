import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Get a specific yosegaki
export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const yosegaki = await prisma.yosegaki.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        contributions: {
          include: {
            contributor: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            recording: true,
          },
        },
      },
    });

    if (!yosegaki) {
      return NextResponse.json(
        { error: "Yosegaki not found" },
        { status: 404 }
      );
    }

    // Check permission
    const isCreator = yosegaki.creatorId === user.id;
    const hasContributed = yosegaki.contributions.some(
      (c) => c.contributorId === user.id
    );

    if (!isCreator && !hasContributed && !yosegaki.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ yosegaki });
  } catch (error: any) {
    console.error("Get yosegaki error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update yosegaki
export async function PUT(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { title, description, status, dueDate, isPublic } = body;

    const existingYosegaki = await prisma.yosegaki.findUnique({
      where: { id },
    });

    if (!existingYosegaki) {
      return NextResponse.json(
        { error: "Yosegaki not found" },
        { status: 404 }
      );
    }

    // Only creator can update
    if (existingYosegaki.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const yosegaki = await prisma.yosegaki.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        contributions: {
          include: {
            contributor: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            recording: true,
          },
        },
      },
    });

    return NextResponse.json({ yosegaki });
  } catch (error: any) {
    console.error("Update yosegaki error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete yosegaki
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const yosegaki = await prisma.yosegaki.findUnique({
      where: { id },
    });

    if (!yosegaki) {
      return NextResponse.json(
        { error: "Yosegaki not found" },
        { status: 404 }
      );
    }

    // Only creator can delete
    if (yosegaki.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.yosegaki.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete yosegaki error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
