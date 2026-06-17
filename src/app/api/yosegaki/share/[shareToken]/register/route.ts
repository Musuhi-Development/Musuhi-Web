import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ shareToken: string }> };

// POST: ログイン済みユーザーが shareToken ページを訪問した際に自動登録
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shareToken } = await params;

    const yosegaki = await prisma.yosegaki.findUnique({
      where: { shareToken },
      select: { id: true, creatorId: true, status: true },
    });

    if (!yosegaki) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 企画者自身は登録不要
    if (yosegaki.creatorId === user.id) {
      return NextResponse.json({ skipped: true });
    }

    // collecting 状態のみ登録受付
    if (yosegaki.status !== "collecting") {
      return NextResponse.json({ skipped: true });
    }

    // 既に contribution があれば何もしない（upsert でも skipDuplicates でも可）
    const existing = await prisma.yosegakiContribution.findFirst({
      where: { yosegakiId: yosegaki.id, contributorId: user.id },
    });

    if (!existing) {
      await prisma.yosegakiContribution.create({
        data: { yosegakiId: yosegaki.id, contributorId: user.id },
      });
    }

    return NextResponse.json({ registered: !existing });
  } catch (error) {
    console.error("Register invitee error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
