import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { giftDeliveryHtml, giftDeliveryText } from "@/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Vercel Pro: 最大300秒、Hobby: 最大60秒
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.VOICE_GIFT_CRON_SECRET;
    const token = request.headers.get("x-cron-secret");

    if (!secret || token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const dueGifts = await prisma.voiceGift.findMany({
      where: {
        status: "scheduled",
        sendAt: { lte: now },
      },
      select: {
        id: true,
        shareToken: true,
        title: true,
        message: true,
        owner: { select: { name: true, displayName: true } },
        recipients: { select: { recipientEmail: true } },
      },
    });

    if (dueGifts.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    const internalSecret = process.env.INTERNAL_API_SECRET;
    const emailHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
    };

    await Promise.all(
      dueGifts.map(async (gift) => {
        await prisma.voiceGift.update({
          where: { id: gift.id },
          data: { status: "sent" },
        });
        await prisma.voiceGiftRecipient.updateMany({
          where: { voiceGiftId: gift.id, status: "pending" },
          data: { status: "delivered", deliveredAt: now },
        });

        const emailRecipients = gift.recipients
          .map((r) => r.recipientEmail)
          .filter(Boolean) as string[];

        if (emailRecipients.length === 0) return;

        const senderName = gift.owner.displayName ?? gift.owner.name ?? "Musuhi ユーザー";
        const giftUrl = `${APP_URL}/gift/share/${gift.shareToken}`;
        const opts = {
          senderName,
          giftTitle: gift.title,
          giftMessage: gift.message,
          giftUrl,
        };

        await Promise.allSettled(
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
                `[voice-gifts/process] gift delivery email failed to ${emailRecipients[i]}:`,
                r.reason
              );
            }
          });
        });
      })
    );

    return NextResponse.json({ processed: dueGifts.length });
  } catch (error: any) {
    console.error("Process voice gifts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
