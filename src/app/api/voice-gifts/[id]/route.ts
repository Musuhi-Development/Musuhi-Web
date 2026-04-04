import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function canAccessGift(userId: string, email: string | null, voiceGift: any) {
  if (voiceGift.ownerId === userId) return true;
  if (voiceGift.participants?.some((p: any) => p.userId === userId)) return true;
  if (voiceGift.recipients?.some((r: any) => r.recipientId === userId)) return true;
  if (email && voiceGift.recipients?.some((r: any) => r.recipientEmail === email)) return true;
  return false;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const voiceGift = await prisma.voiceGift.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        recipients: {
          include: {
            recipient: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
        recordings: {
          include: {
            recording: true,
            contributor: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!voiceGift) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    if (!canAccessGift(user.id, user.email, voiceGift)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipient = voiceGift.recipients.find(
      (r: any) => r.recipientId === user.id || (user.email && r.recipientEmail === user.email)
    );

    if (recipient && recipient.status !== "opened" && voiceGift.status === "sent") {
      await prisma.voiceGiftRecipient.update({
        where: { id: recipient.id },
        data: { status: "opened", openedAt: new Date() },
      });
    }

    return NextResponse.json({ voiceGift });
  } catch (error: any) {
    console.error("Get voice gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();

    const { title, message, status, sendAt, sendNow } = body;

    const existing = await prisma.voiceGift.findUnique({
      where: { id },
      include: { recipients: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    if (existing.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (message !== undefined) updates.message = message;

    if (sendAt !== undefined || sendNow) {
      const now = new Date();
      const parsedSendAt = sendAt ? new Date(sendAt) : null;
      if (parsedSendAt) {
        const maxSendAt = new Date();
        maxSendAt.setDate(maxSendAt.getDate() + 7);
        if (parsedSendAt > maxSendAt) {
          return NextResponse.json(
            { error: "sendAt must be within 7 days" },
            { status: 400 }
          );
        }
      }
      if (sendNow) {
        updates.status = "sent";
        updates.sendAt = now;
      } else if (!parsedSendAt) {
        updates.status = "draft";
        updates.sendAt = null;
      } else if (parsedSendAt <= now) {
        updates.status = "sent";
        updates.sendAt = parsedSendAt;
      } else {
        updates.status = "scheduled";
        updates.sendAt = parsedSendAt;
      }
    } else if (status) {
      updates.status = status;
    }

    const voiceGift = await prisma.voiceGift.update({
      where: { id },
      data: updates,
      include: {
        owner: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        recipients: {
          include: {
            recipient: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
        recordings: {
          include: {
            recording: true,
            contributor: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (updates.status === "sent") {
      await prisma.voiceGiftRecipient.updateMany({
        where: { voiceGiftId: id, status: "pending" },
        data: { status: "delivered", deliveredAt: new Date() },
      });
    }

    return NextResponse.json({ voiceGift });
  } catch (error: any) {
    console.error("Update voice gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const existing = await prisma.voiceGift.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    if (existing.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.voiceGift.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete voice gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
