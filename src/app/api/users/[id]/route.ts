import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    const profile = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recordings: true,
            sentGifts: true,
            receivedGifts: true,
            boards: true,
            connectionsInitiated: {
              where: { status: "accepted" },
            },
            connectionsReceived: {
              where: { status: "accepted" },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = currentUser.id === id;

    if (!isSelf) {
      const connection = await prisma.connection.findFirst({
        where: {
          status: "accepted",
          OR: [
            { initiatorId: currentUser.id, receiverId: id },
            { initiatorId: id, receiverId: currentUser.id },
          ],
        },
      });

      if (!connection) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ user: profile });
  } catch (error: any) {
    console.error("Get user profile by id error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
