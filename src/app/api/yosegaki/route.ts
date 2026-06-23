import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSessionUser } from "@/lib/auth";

const yosegakiInclude = {
  creator: {
    select: { id: true, name: true, displayName: true, avatarUrl: true },
  },
  contributions: {
    include: {
      contributor: {
        select: { id: true, name: true, displayName: true, avatarUrl: true },
      },
      recording: true,
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'created' | 'contributed' | 'collaborative'
    const now = new Date();

    let where: any = {};

    if (type === "created") {
      where.creatorId = user.id;
    } else if (type === "contributed") {
      where.contributions = { some: { contributorId: user.id } };
    } else if (type === "collaborative") {
      // みんなで贈るタブ: 自分が作成 or 招待/参加済み かつ collecting or completed
      // deliverAt が過ぎ、かつ録音済み参加者が1名以上 → delivered 相当として除外
      // （参加者0名で終了したカードは引き続き表示し、企画者が削除できるようにする）
      where.OR = [
        { creatorId: user.id },
        { contributions: { some: { contributorId: user.id } } },
      ];
      where.status = { in: ["collecting", "completed"] };
      where.NOT = {
        AND: [
          { deliverAt: { lte: now } },
          { contributions: { some: { audioUrl: { not: null } } } },
        ],
      };
    } else if (type === "delivered") {
      // 贈ったタブ: status が delivered のもの
      // + cron 未実行でも deliverAt 過ぎ & 録音済み参加者1名以上は贈った扱い
      where.OR = [
        { creatorId: user.id },
        { contributions: { some: { contributorId: user.id } } },
      ];
      where.AND = [
        {
          OR: [
            { status: "delivered" },
            {
              AND: [
                { status: { in: ["collecting", "completed"] } },
                { deliverAt: { lte: now } },
                { contributions: { some: { audioUrl: { not: null } } } },
              ],
            },
          ],
        },
      ];
    } else {
      where.OR = [
        { creatorId: user.id },
        { contributions: { some: { contributorId: user.id } } },
      ];
    }

    const orderBy =
      type === "collaborative" ? { deadline: "asc" as const } :
      type === "delivered"     ? { updatedAt: "desc" as const } :
      type === "created"       ? { updatedAt: "desc" as const } :
      { createdAt: "desc" as const };

    const yosegakiList = await prisma.yosegaki.findMany({
      where,
      orderBy,
      include: yosegakiInclude,
    });

    return NextResponse.json({ yosegakiList });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const {
      title,
      description,
      recipientName,
      recipientEmail,
      organizerName,
      organizerComment,
      organizerImageUrl,
      organizerAudioUrl,
      organizerAudioTitle,
      organizerAudioComment,
      senderName,
      deadline,
      deliverAt,
      isPublic,
      participantIds,
    } = body;

    if (!title || !recipientName || !organizerName || !deadline || !deliverAt) {
      return NextResponse.json(
        { error: "title, recipientName, organizerName, deadline, deliverAt are required" },
        { status: 400 }
      );
    }

    const yosegaki = await prisma.yosegaki.create({
      data: {
        title,
        description: description || null,
        recipientName,
        recipientEmail: recipientEmail || null,
        creatorId: user.id,
        organizerName,
        organizerComment: organizerComment || null,
        organizerImageUrl: organizerImageUrl || null,
        organizerAudioUrl: organizerAudioUrl || null,
        organizerAudioTitle: organizerAudioTitle || null,
        organizerAudioComment: organizerAudioComment || null,
        senderName: senderName || null,
        deadline: new Date(deadline),
        deliverAt: new Date(deliverAt),
        isPublic: isPublic || false,
        status: "draft",
      },
      include: yosegakiInclude,
    });

    // 招待参加者の YosegakiContribution を未参加状態で作成
    if (Array.isArray(participantIds) && participantIds.length > 0) {
      const ids = participantIds as string[];
      const uniqueIds = ids.filter((id: string, idx: number) => ids.indexOf(id) === idx && id !== user.id);
      if (uniqueIds.length > 0) {
        await prisma.yosegakiContribution.createMany({
          data: uniqueIds.map((participantId) => ({
            yosegakiId: yosegaki.id,
            contributorId: participantId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ yosegaki }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
