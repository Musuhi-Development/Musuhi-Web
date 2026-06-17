import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
      select: { id: true },
    });

    if (deliverDue.length > 0) {
      await Promise.all(
        deliverDue.map((y) =>
          prisma.yosegaki.update({
            where: { id: y.id },
            data: { status: "delivered" },
          })
        )
      );
    }

    return NextResponse.json({
      completedCount: deadlinePassed.length,
      deliveredCount: deliverDue.length,
    });
  } catch (error: any) {
    console.error("Process yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
