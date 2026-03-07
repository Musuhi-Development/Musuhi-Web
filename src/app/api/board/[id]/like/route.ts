import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// POST: Like a board post
export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    // Check if board exists
    const board = await prisma.board.findUnique({
      where: { id },
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        boardId_userId: {
          boardId: id,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Already liked" },
        { status: 400 }
      );
    }

    const like = await prisma.like.create({
      data: {
        boardId: id,
        userId: user.id,
      },
    });

    return NextResponse.json({ like }, { status: 201 });
  } catch (error: any) {
    console.error("Like board error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Unlike a board post
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const like = await prisma.like.findUnique({
      where: {
        boardId_userId: {
          boardId: id,
          userId: user.id,
        },
      },
    });

    if (!like) {
      return NextResponse.json(
        { error: "Like not found" },
        { status: 404 }
      );
    }

    await prisma.like.delete({
      where: {
        id: like.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unlike board error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
