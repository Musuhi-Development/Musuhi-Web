import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// POST: Add contribution to yosegaki
export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { recordingId, message } = body;

    if (!recordingId) {
      return NextResponse.json(
        { error: "recordingId is required" },
        { status: 400 }
      );
    }

    // Check if yosegaki exists
    const yosegaki = await prisma.yosegaki.findUnique({
      where: { id },
    });

    if (!yosegaki) {
      return NextResponse.json(
        { error: "Yosegaki not found" },
        { status: 404 }
      );
    }

    if (yosegaki.status !== "collecting") {
      return NextResponse.json(
        { error: "Yosegaki is not accepting contributions" },
        { status: 400 }
      );
    }

    // Check if recording exists and belongs to user
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    if (recording.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only contribute with your own recordings" },
        { status: 403 }
      );
    }

    // Create contribution
    const contribution = await prisma.yosegakiContribution.create({
      data: {
        yosegakiId: id,
        recordingId,
        contributorId: user.id,
        message: message || null,
      },
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recording: true,
      },
    });

    return NextResponse.json({ contribution }, { status: 201 });
  } catch (error: any) {
    console.error("Add contribution error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You have already contributed to this yosegaki" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove contribution from yosegaki
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const contributionId = searchParams.get("contributionId");

    if (!contributionId) {
      return NextResponse.json(
        { error: "contributionId is required" },
        { status: 400 }
      );
    }

    const contribution = await prisma.yosegakiContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      );
    }

    // Only contributor can delete their own contribution
    if (contribution.contributorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.yosegakiContribution.delete({
      where: { id: contributionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete contribution error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
