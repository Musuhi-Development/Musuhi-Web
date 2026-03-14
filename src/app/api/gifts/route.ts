import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: Get gifts (sent or received)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'sent' or 'received'

    let where: any = {};

    if (type === "sent") {
      where.senderId = user.id;
    } else if (type === "received") {
      where.OR = [
        { recipientId: user.id },
        { recipientEmail: user.email },
      ];
    } else {
      // All gifts (both sent and received)
      where.OR = [
        { senderId: user.id },
        { recipientId: user.id },
        { recipientEmail: user.email },
      ];
    }

    const gifts = await prisma.gift.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        recording: true,
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ gifts });
  } catch (error: any) {
    console.error("Get gifts error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new gift
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { title, message, recordingId, recipientId, recipientEmail, isPublic, expiresAt } = body;

    if (!title || !recordingId) {
      return NextResponse.json(
        { error: "Title and recordingId are required" },
        { status: 400 }
      );
    }

    if (!recipientId && !recipientEmail) {
      return NextResponse.json(
        { error: "Either recipientId or recipientEmail is required" },
        { status: 400 }
      );
    }

    // Verify recording exists and belongs to user
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    if (recording.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only send gifts with your own recordings" },
        { status: 403 }
      );
    }

    const gift = await prisma.gift.create({
      data: {
        title,
        message: message || null,
        recordingId,
        senderId: user.id,
        recipientId: recipientId || null,
        recipientEmail: recipientEmail || null,
        isPublic: isPublic || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        recording: true,
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ gift }, { status: 201 });
  } catch (error: any) {
    console.error("Create gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
