import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { yosegakiDeliveryHtml, yosegakiDeliveryText } from "@/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.musuhi-voice.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = process.env.YOSEGAKI_CRON_SECRET || process.env.VOICE_GIFT_CRON_SECRET;
    const token = searchParams.get("secret");

    if (secret && token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Stage 1: collecting + deadline過ぎ → completed（募集終了）
    const deadlinePassed = await prisma.yosegaki.findMany({
      where: {
        status: "collecting",
        deadline: { lte: now },
      },
      select: { id: true },
    });

    if (deadlinePassed.length > 0) {
      await Promise.all(
        deadlinePassed.map((y) =>
          prisma.yosegaki.update({
            where: { id: y.id },
            data: { status: "completed" },
          })
        )
      );
    }

    // Stage 2: completed + deliverAt過ぎ → delivered（お届け完了）
    const deliverDue = await prisma.yosegaki.findMany({
      where: {
        status: "completed",
        deliverAt: { lte: now },
      },
      select: {
        id: true,
        title: true,
        recipientName: true,
        recipientEmail: true,
        senderName: true,
        organizerName: true,
        shareToken: true,
        creator: {
          select: { displayName: true, name: true },
        },
      },
    });

    let deliveredCount = 0;
    if (deliverDue.length > 0) {
      await Promise.all(
        deliverDue.map(async (y) => {
          await prisma.yosegaki.update({
            where: { id: y.id },
            data: { status: "delivered" },
          });
          deliveredCount++;

          if (y.recipientEmail) {
            const senderName =
              y.senderName ||
              y.organizerName ||
              y.creator.displayName ||
              y.creator.name ||
              "Musuhi";
            const viewUrl = `${APP_URL}/yosegaki/${y.shareToken}/view`;

            try {
              await sendEmail({
                to: y.recipientEmail,
                subject: `【Musuhi】${senderName}さんから、あなたへ。特別な聴く手紙が届いています`,
                html: yosegakiDeliveryHtml({
                  senderName,
                  recipientName: y.recipientName,
                  viewUrl,
                }),
                text: yosegakiDeliveryText({
                  senderName,
                  recipientName: y.recipientName,
                  viewUrl,
                }),
              });
            } catch (emailError) {
              console.error(`Failed to send delivery email for yosegaki ${y.id}:`, emailError);
            }
          }
        })
      );
    }

    return NextResponse.json({
      completedCount: deadlinePassed.length,
      deliveredCount,
    });
  } catch (error: any) {
    console.error("Process yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
