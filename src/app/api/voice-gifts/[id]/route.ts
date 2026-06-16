import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { giftDeliveryHtml, giftDeliveryText } from "@/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

    const { title, message, status, sendAt, sendNow, recordingId } = body;

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

    // ジャーナル（ポラロイド）差し替え
    if (recordingId) {
      const existingRec = await prisma.voiceGiftRecording.findFirst({
        where: { voiceGiftId: id },
        orderBy: { createdAt: "asc" },
      });
      if (existingRec) {
        await prisma.voiceGiftRecording.update({
          where: { id: existingRec.id },
          data: { recordingId },
        });
      } else {
        await prisma.voiceGiftRecording.create({
          data: { voiceGiftId: id, recordingId, contributorId: user.id },
        });
      }
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

      const emailRecipients = existing.recipients
        .map((r: any) => r.recipientEmail)
        .filter(Boolean) as string[];

      if (emailRecipients.length > 0) {
        const senderName =
          voiceGift.owner.displayName ?? voiceGift.owner.name ?? "Musuhi ユーザー";
        const giftUrl = `${APP_URL}/gift/share/${voiceGift.shareToken}`;
        const opts = {
          senderName,
          giftTitle: voiceGift.title,
          giftMessage: voiceGift.message,
          giftUrl,
        };
        const internalSecret = process.env.INTERNAL_API_SECRET;
        const emailHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
        };
        Promise.allSettled(
          emailRecipients.map(async (to) => {
            const res = await fetch(`${APP_URL}/api/email/send`, {
              method: "POST",
              headers: emailHeaders,
              body: JSON.stringify({
                to,
                subject: `【Musuhi】${senderName} さんから声のギフトが届きました`,
                html: giftDeliveryHtml(opts),
                text: giftDeliveryText(opts),
              }),
            });
            if (!res.ok) {
              throw new Error(`email/send returned ${res.status} for ${to}`);
            }
          })
        ).then((results) => {
          results.forEach((r, i) => {
            if (r.status === "rejected") {
              console.error(
                `[voice-gifts PUT] gift delivery email failed to ${emailRecipients[i]}:`,
                r.reason
              );
            }
          });
        });
      }
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
