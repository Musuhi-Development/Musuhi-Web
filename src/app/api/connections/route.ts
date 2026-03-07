import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: Get connections for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, accepted, blocked

    let where: any = {
      OR: [
        { initiatorId: user.id },
        { receiverId: user.id },
      ],
    };

    if (status) {
      where.status = status;
    }

    const connections = await prisma.connection.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error("Get connections error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a connection request
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: userId },
          { initiatorId: userId, receiverId: user.id },
        ],
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.create({
      data: {
        initiatorId: user.id,
        receiverId: userId,
        status: "pending",
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error: any) {
    console.error("Create connection error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
