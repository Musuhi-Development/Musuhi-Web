import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

// GET: Get connections for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, accepted, blocked

    let where: any = {
      OR: [
        { initiatorId: user.id },
        { receiverId: user.id },
      ],
    };

    if (status) {
      where.status = status;
    } else {
      // ステータス指定がない場合は pending と accepted を取得
      where.status = { in: ["pending", "accepted"] };
    }

    const connections = await prisma.connection.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error("Get connections error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    return NextResponse.json({ error: "つながりの取得中にエラーが発生しました。" }, { status: 500 });
  }
}

const createConnectionSchema = z.object({
  receiverId: z.string().min(1, "受信者のIDは必須です。"),
});

// POST: Create a new connection request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validation = createConnectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { receiverId } = validation.data;

    if (user.id === receiverId) {
      return NextResponse.json({ error: "自分自身につながりリクエストは送信できません。" }, { status: 400 });
    }

    // 既存のつながりを確認
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: receiverId },
          { initiatorId: receiverId, receiverId: user.id },
        ],
      },
    });

    if (existingConnection) {
      return NextResponse.json({ error: "既につながりリクエストが存在するか、つながり済みです。" }, { status: 400 });
    }

    const newConnection = await prisma.connection.create({
      data: {
        initiatorId: user.id,
        receiverId: receiverId,
        status: "pending",
      },
    });

    return NextResponse.json({ connection: newConnection }, { status: 201 });
  } catch (error: any) {
    console.error("Create connection error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    return NextResponse.json({ error: "つながりリクエストの作成中にエラーが発生しました。" }, { status: 500 });
  }
}
