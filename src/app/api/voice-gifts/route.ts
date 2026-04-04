import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function normalizeEmails(emails: string[] | undefined) {
  if (!emails) return [];
  return Array.from(
    new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0)
    )
  );
}

function normalizeIds(ids: string[] | undefined) {
  if (!ids) return [];
  return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)));
}

function getStatusForSendAt(sendAt: Date | null, sendNow: boolean) {
  const now = new Date();
  if (sendNow) return { status: "sent", effectiveSendAt: now } as const;
  if (!sendAt) return { status: "draft", effectiveSendAt: null } as const;
  if (sendAt <= now) return { status: "sent", effectiveSendAt: sendAt } as const;
  return { status: "scheduled", effectiveSendAt: sendAt } as const;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const baseWhere = {
      OR: [
        { ownerId: user.id },
        { participants: { some: { userId: user.id } } },
        {
          recipients: {
            some: {
              OR: [{ recipientId: user.id }, { recipientEmail: user.email }],
            },
          },
        },
      ],
    } as const;

    const where: any = { ...baseWhere };

    if (filter === "sent") {
      where.status = "sent";
      where.OR = [
        { ownerId: user.id },
        { participants: { some: { userId: user.id } } },
      ];
    } else if (filter === "received") {
      where.status = "sent";
      where.OR = [
        {
          recipients: {
            some: {
              OR: [{ recipientId: user.id }, { recipientEmail: user.email }],
            },
          },
        },
      ];
    } else if (filter === "draft") {
      where.status = "draft";
    } else if (filter === "scheduled") {
      where.status = "scheduled";
    }

    const voiceGifts = await prisma.voiceGift.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ voiceGifts });
  } catch (error: any) {
    console.error("Get voice gifts error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      title,
      message,
      recipientIds,
      recipientEmails,
      recordingIds,
      sendAt,
      sendNow,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const normalizedRecipientIds = normalizeIds(recipientIds);
    const normalizedRecipientEmails = normalizeEmails(recipientEmails);

    if (normalizedRecipientIds.length === 0 && normalizedRecipientEmails.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    const normalizedRecordingIds = normalizeIds(recordingIds);

    if (normalizedRecordingIds.length > 0) {
      const recordings = await prisma.recording.findMany({
        where: { id: { in: normalizedRecordingIds } },
      });

      if (recordings.length !== normalizedRecordingIds.length) {
        return NextResponse.json(
          { error: "One or more recordings not found" },
          { status: 404 }
        );
      }

      const hasForeignRecording = recordings.some((rec: { userId: string }) => rec.userId !== user.id);
      if (hasForeignRecording) {
        return NextResponse.json(
          { error: "You can only attach your own recordings" },
          { status: 403 }
        );
      }
    }

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
    const { status, effectiveSendAt } = getStatusForSendAt(parsedSendAt, Boolean(sendNow));

    const deliveredAt = status === "sent" ? new Date() : null;
    const recipientCreateData = [
      ...normalizedRecipientIds.map((id) => ({
        recipientId: id,
        status: status === "sent" ? "delivered" : "pending",
        deliveredAt,
      })),
      ...normalizedRecipientEmails.map((email) => ({
        recipientEmail: email,
        status: status === "sent" ? "delivered" : "pending",
        deliveredAt,
      })),
    ];

    const voiceGift = await prisma.voiceGift.create({
      data: {
        title,
        message: message || null,
        ownerId: user.id,
        status,
        sendAt: effectiveSendAt,
        shareToken: randomUUID(),
        recipients: { create: recipientCreateData },
        participants: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
        recordings: {
          create: normalizedRecordingIds.map((recordingId: string) => ({
            recordingId,
            contributorId: user.id,
          })),
        },
      },
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

    return NextResponse.json({ voiceGift }, { status: 201 });
  } catch (error: any) {
    console.error("Create voice gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
