import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function canAccessBoard(boardId: string, userId?: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      id: true,
      authorId: true,
      isPublic: true,
    },
  });

  if (!board) {
    return { allowed: false as const, reason: "not_found" as const };
  }

  if (board.isPublic) {
    return { allowed: true as const, board };
  }

  if (!userId) {
    return { allowed: false as const, reason: "forbidden" as const };
  }

  if (board.authorId === userId) {
    return { allowed: true as const, board };
  }

  const connection = await prisma.connection.findFirst({
    where: {
      status: "accepted",
      OR: [
        { initiatorId: userId, receiverId: board.authorId },
        { initiatorId: board.authorId, receiverId: userId },
      ],
    },
    select: { id: true },
  });

  if (!connection) {
    return { allowed: false as const, reason: "forbidden" as const };
  }

  return { allowed: true as const, board };
}

// GET: Get comments for a board post
export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    const access = await canAccessBoard(id, user?.id);
    if (!access.allowed) {
      if (access.reason === "not_found") {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        boardId: id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a comment to a board post
export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { content, audioUrl, duration } = body;

    const normalizedContent = typeof content === "string" ? content.trim() : "";
    const normalizedAudioUrl = typeof audioUrl === "string" ? audioUrl : null;
    const normalizedDuration =
      typeof duration === "number" && Number.isFinite(duration)
        ? Math.round(duration)
        : null;

    if (!normalizedContent && !normalizedAudioUrl) {
      return NextResponse.json(
        { error: "Content or audioUrl is required" },
        { status: 400 }
      );
    }

    const access = await canAccessBoard(id, user.id);
    if (!access.allowed) {
      if (access.reason === "not_found") {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: normalizedContent || null,
        audioUrl: normalizedAudioUrl,
        duration: normalizedDuration,
        boardId: id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error("Create comment error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Only author can delete their comment
    if (comment.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete comment error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
