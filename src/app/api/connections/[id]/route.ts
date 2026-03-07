import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH: Update connection status (accept/reject/block)
export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { status } = body; // accepted, blocked

    if (!status || !["accepted", "blocked"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Only receiver can accept/block
    if (connection.receiverId !== user.id) {
      return NextResponse.json(
        { error: "Only the receiver can update this connection" },
        { status: 403 }
      );
    }

    const updatedConnection = await prisma.connection.update({
      where: { id },
      data: { status },
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

    return NextResponse.json({ connection: updatedConnection });
  } catch (error: any) {
    console.error("Update connection error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove connection
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Either party can remove the connection
    if (connection.initiatorId !== user.id && connection.receiverId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.connection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete connection error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
