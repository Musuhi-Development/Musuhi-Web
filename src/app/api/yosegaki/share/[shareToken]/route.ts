import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ shareToken: string }> };

// GET: 公開API — 認証不要でshareTokenから寄せ音声を取得
export async function GET(_request: Request, { params }: Params) {
  try {
    const { shareToken } = await params;

    const yosegaki = await prisma.yosegaki.findUnique({
      where: { shareToken },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        contributions: {
          orderBy: { createdAt: "asc" },
          include: {
            contributor: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
            recording: {
              select: { id: true, title: true, audioUrl: true, duration: true, images: true },
            },
          },
        },
      },
    });

    if (!yosegaki) {
      return NextResponse.json({ error: "Yosegaki not found" }, { status: 404 });
    }

    // 公開可能なステータスのみ
    if (yosegaki.status === "draft") {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }

    return NextResponse.json({ yosegaki });
  } catch (error) {
    console.error("Get yosegaki share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
