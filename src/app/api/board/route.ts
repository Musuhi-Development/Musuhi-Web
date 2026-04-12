import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSessionUser } from "@/lib/auth";

// GET: Get all board posts
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    let where: any = {};

    let friendIds: string[] = [];
    if (user) {
      const connections = await prisma.connection.findMany({
        where: {
          status: "accepted",
          OR: [{ initiatorId: user.id }, { receiverId: user.id }],
        },
        select: {
          initiatorId: true,
          receiverId: true,
        },
      });

      friendIds = connections.map((connection) =>
        connection.initiatorId === user.id ? connection.receiverId : connection.initiatorId
      );
    }

    if (isPublic) {
      where.isPublic = true;
    } else if (user) {
      // Show public posts, user's own posts, and friends-only posts from accepted connections
      where.OR = [
        { isPublic: true },
        { authorId: user.id },
        {
          isPublic: false,
          authorId: { in: friendIds.length > 0 ? friendIds : ["__no_friend__"] },
        },
      ];
    } else {
      // Not logged in, only show public posts
      where.isPublic = true;
    }

    const boards = await prisma.board.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        recording: {
          select: {
            emotions: true,
            images: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        ...(user && {
          likes: {
            where: {
              userId: user.id,
            },
            select: {
              id: true,
            },
          },
        }),
      },
    });

    return NextResponse.json({ boards });
  } catch (error) {
    console.error("Get boards error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new board post
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { title, content, audioUrl, duration, isPublic } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const board = await prisma.board.create({
      data: {
        title,
        content: content || null,
        audioUrl: audioUrl || null,
        duration: duration || null,
        authorId: user.id,
        isPublic: isPublic !== undefined ? isPublic : true,
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
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error: any) {
    console.error("Create board error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
