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

    const dueYosegaki = await prisma.yosegaki.findMany({
      where: {
        status: "collecting",
        deliverAt: { lte: now },
      },
      select: { id: true },
    });

    if (dueYosegaki.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    await Promise.all(
      dueYosegaki.map((y) =>
        prisma.yosegaki.update({
          where: { id: y.id },
          data: { status: "delivered" },
        })
      )
    );

    return NextResponse.json({ processed: dueYosegaki.length });
  } catch (error: any) {
    console.error("Process yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
