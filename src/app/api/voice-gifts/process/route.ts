import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = process.env.VOICE_GIFT_CRON_SECRET;
    const token = searchParams.get("secret");

    if (secret && token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const dueGifts = await prisma.voiceGift.findMany({
      where: {
        status: "scheduled",
        sendAt: { lte: now },
      },
      select: { id: true },
    });

    if (dueGifts.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

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
      })
    );

    return NextResponse.json({ processed: dueGifts.length });
  } catch (error: any) {
    console.error("Process voice gifts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
