import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const user = await requireAuth();

    const voiceGift = await prisma.voiceGift.findUnique({
      where: { shareToken: token },
    });

    if (!voiceGift) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    if (voiceGift.status === "sent" || voiceGift.status === "canceled") {
      return NextResponse.json(
        { error: "Voice gift is no longer accepting contributions" },
        { status: 400 }
      );
    }

    await prisma.voiceGiftParticipant.upsert({
      where: {
        voiceGiftId_userId: { voiceGiftId: voiceGift.id, userId: user.id },
      },
      update: {},
      create: {
        voiceGiftId: voiceGift.id,
        userId: user.id,
        role: "contributor",
      },
    });

    return NextResponse.json({ voiceGiftId: voiceGift.id });
  } catch (error: any) {
    console.error("Join voice gift error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
