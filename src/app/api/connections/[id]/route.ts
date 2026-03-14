import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const updateConnectionSchema = z.object({
  status: z.enum(["accepted", "blocked"]),
});

// PUT: Update connection status (accept or block)
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const user = await requireAuth();
    const { id: connectionId } = await params;
    const body = await request.json();

    if (!connectionId) {
      return NextResponse.json({ error: "接続IDが不正です。" }, { status: 400 });
    }

    const validation = updateConnectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "つながりが見つかりません。" },
        { status: 404 }
      );
    }

    // リクエストの受信者のみがステータスを更新できる
    if (connection.receiverId !== user.id) {
      return NextResponse.json(
        { error: "この操作を行う権限がありません。" },
        { status: 403 }
      );
    }

    // 承認待ちのリクエストのみ更新可能
    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "このリクエストは既に処理されています。" },
        { status: 400 }
      );
    }

    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
    });

    return NextResponse.json({ connection: updatedConnection });
  } catch (error: any) {
    console.error("Update connection error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "つながりの更新中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a connection or cancel a request
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const user = await requireAuth();
    const { id: connectionId } = await params;

    if (!connectionId) {
      return NextResponse.json({ error: "接続IDが不正です。" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "つながりが見つかりません。" },
        { status: 404 }
      );
    }

    // initiator または receiver のみが削除できる
    if (connection.initiatorId !== user.id && connection.receiverId !== user.id) {
      return NextResponse.json(
        { error: "この操作を行う権限がありません。" },
        { status: 403 }
      );
    }

    await prisma.connection.delete({
      where: { id: connectionId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Delete connection error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "つながりの削除中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
