import { NextResponse, NextRequest, after } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";
import {
  giftDeliveryHtml,
  giftDeliveryText,
  collabInviteHtml,
  collabInviteText,
} from "@/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

    const orderBy =
      filter === "received" ? { sendAt: "desc" as const } :
      filter === "sent"     ? { sendAt: "desc" as const } :
      filter === "draft"    ? { updatedAt: "desc" as const } :
      filter === "scheduled"? { sendAt: "asc" as const } :
      { createdAt: "desc" as const };

    const voiceGifts = await prisma.voiceGift.findMany({
      where,
      orderBy,
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
      senderName,
      recipientIds,
      recipientEmails,
      participantIds,
      recordingIds,
      sendAt,
      sendNow,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const normalizedRecipientIds = normalizeIds(recipientIds);
    const normalizedRecipientEmails = normalizeEmails(recipientEmails);
    const normalizedParticipantIds = normalizeIds(participantIds).filter((id) => id !== user.id);

    if (normalizedRecipientIds.length === 0 && normalizedRecipientEmails.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    if (normalizedParticipantIds.length > 0) {
      const acceptedConnections = await prisma.connection.findMany({
        where: {
          status: "accepted",
          OR: [
            { initiatorId: user.id, receiverId: { in: normalizedParticipantIds } },
            { receiverId: user.id, initiatorId: { in: normalizedParticipantIds } },
          ],
        },
        select: {
          initiatorId: true,
          receiverId: true,
        },
      });

      const allowedParticipantIds = new Set<string>();
      acceptedConnections.forEach((connection) => {
        const partnerId = connection.initiatorId === user.id ? connection.receiverId : connection.initiatorId;
        allowedParticipantIds.add(partnerId);
      });

      const invalidParticipantIds = normalizedParticipantIds.filter(
        (participantId) => !allowedParticipantIds.has(participantId)
      );

      if (invalidParticipantIds.length > 0) {
        return NextResponse.json(
          { error: "Participants must be selected from accepted connections" },
          { status: 400 }
        );
      }
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
      maxSendAt.setMonth(maxSendAt.getMonth() + 6);
      if (parsedSendAt > maxSendAt) {
        return NextResponse.json(
          { error: "sendAt must be within 6 months" },
          { status: 400 }
        );
      }
    }
    const { status, effectiveSendAt } = getStatusForSendAt(parsedSendAt, Boolean(sendNow));

    const deliveredAt = status === "sent" ? new Date() : null;
    const participantCreateData = [
      {
        userId: user.id,
        role: "owner",
      },
      ...normalizedParticipantIds.map((participantId) => ({
        userId: participantId,
        role: "contributor",
      })),
    ];

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
        senderName: senderName || null,
        ownerId: user.id,
        status,
        sendAt: effectiveSendAt,
        shareToken: randomUUID(),
        recipients: { create: recipientCreateData },
        participants: { create: participantCreateData },
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

    // ─── メール送信（after() でレスポンス後も Vercel 関数を完走させる）───
    const emailSenderName =
      voiceGift.senderName || voiceGift.owner.displayName || voiceGift.owner.name || "Musuhi ユーザー";
    const giftUrl = `${APP_URL}/gift/share/${voiceGift.shareToken}`;

    after(async () => {
      // 1) ギフト受信通知 — メールアドレス宛の受信者
      if (status === "sent" && normalizedRecipientEmails.length > 0) {
        const deliveryEmailOptions = {
          senderName: emailSenderName,
          giftTitle: voiceGift.title,
          giftMessage: voiceGift.message,
          giftUrl,
        };
        const results = await Promise.allSettled(
          normalizedRecipientEmails.map((to) =>
            sendEmail({
              to,
              subject: `【Musuhi】 ${emailSenderName}さんから、あなたへ。特別な「聞く手紙」が届いています`,
              html: giftDeliveryHtml(deliveryEmailOptions),
              text: giftDeliveryText(deliveryEmailOptions),
            })
          )
        );
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(
              `[voice-gifts] gift delivery email failed to ${normalizedRecipientEmails[i]}:`,
              r.reason
            );
          }
        });
      }

      // 2) コラボ招待 — 共同作成メンバーへメール
      if (normalizedParticipantIds.length > 0) {
        try {
          const participants = await prisma.user.findMany({
            where: { id: { in: normalizedParticipantIds } },
            select: { email: true },
          });
          const inviteEmails = participants.map((p) => p.email).filter(Boolean) as string[];
          if (inviteEmails.length > 0) {
            const inviteOptions = {
              inviterName: emailSenderName,
              giftTitle: voiceGift.title,
              giftMessage: voiceGift.message,
              inviteUrl: giftUrl,
            };
            const results = await Promise.allSettled(
              inviteEmails.map((to) =>
                sendEmail({
                  to,
                  subject: `【Musuhi】${emailSenderName} さんから声のギフト作りに招待されました`,
                  html: collabInviteHtml(inviteOptions),
                  text: collabInviteText(inviteOptions),
                })
              )
            );
            results.forEach((r, i) => {
              if (r.status === "rejected") {
                console.error(
                  `[voice-gifts] collab invite email failed to participant[${i}]:`,
                  r.reason
                );
              }
            });
          }
        } catch (err) {
          console.error("[voice-gifts] collab invite email lookup failed:", err);
        }
      }
    });
    // ────────────────────────────────────────────────────────────────────

    return NextResponse.json({ voiceGift }, { status: 201 });
  } catch (error: any) {
    console.error("Create voice gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
