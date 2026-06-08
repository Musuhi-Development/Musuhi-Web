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

    let where: any = {};

    if (type === "created") {
      where.creatorId = user.id;
    } else if (type === "contributed") {
      where.contributions = { some: { contributorId: user.id } };
    } else if (type === "collaborative") {
      // みんなで贈るタブ: 招待された or 参加済み or 募集期間中
      where.OR = [
        { creatorId: user.id },
        { contributions: { some: { contributorId: user.id } } },
      ];
      where.status = { in: ["collecting"] };
    } else {
      where.OR = [
        { creatorId: user.id },
        { contributions: { some: { contributorId: user.id } } },
      ];
    }

    const yosegakiList = await prisma.yosegaki.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
      deadline,
      deliverAt,
      isPublic,
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
        deadline: new Date(deadline),
        deliverAt: new Date(deliverAt),
        isPublic: isPublic || false,
        status: "draft",
      },
      include: yosegakiInclude,
    });

    return NextResponse.json({ yosegaki }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
