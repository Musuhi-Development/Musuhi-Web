import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Get a specific gift
export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const gift = await prisma.gift.findUnique({
      where: { id },
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

    if (!gift) {
      return NextResponse.json(
        { error: "Gift not found" },
        { status: 404 }
      );
    }

    // Check permission
    const isRecipient = gift.recipientId === user.id || gift.recipientEmail === user.email;
    const isSender = gift.senderId === user.id;

    if (!isRecipient && !isSender && !gift.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as opened if recipient is viewing for the first time
    if (isRecipient && !gift.openedAt) {
      await prisma.gift.update({
        where: { id },
        data: {
          openedAt: new Date(),
          status: "opened",
        },
      });
    }

    return NextResponse.json({ gift });
  } catch (error: any) {
    console.error("Get gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a gift
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const gift = await prisma.gift.findUnique({
      where: { id },
    });

    if (!gift) {
      return NextResponse.json(
        { error: "Gift not found" },
        { status: 404 }
      );
    }

    // Only sender can delete
    if (gift.senderId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.gift.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
