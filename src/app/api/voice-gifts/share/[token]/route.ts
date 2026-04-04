import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params;

    const voiceGift = await prisma.voiceGift.findUnique({
      where: { shareToken: token },
      include: {
        owner: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
      },
    });

    if (!voiceGift) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    return NextResponse.json({
      voiceGift: {
        id: voiceGift.id,
        title: voiceGift.title,
        message: voiceGift.message,
        status: voiceGift.status,
        sendAt: voiceGift.sendAt,
        owner: voiceGift.owner,
      },
    });
  } catch (error: any) {
    console.error("Get voice gift share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
