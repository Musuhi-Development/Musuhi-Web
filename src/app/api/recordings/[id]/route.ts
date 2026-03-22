import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function shouldPublishToBoard(visibility: string) {
  return visibility === "public" || visibility === "friends";
}

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Get a specific recording
export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    // Check permission
    if (recording.userId !== user.id && recording.visibility === "private") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ recording });
  } catch (error: any) {
    console.error("Get recording error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update a recording
export async function PUT(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { title, description, emotions, location, visibility } = body;

    // Check if recording exists and belongs to user
    const existingRecording = await prisma.recording.findUnique({
      where: { id },
    });

    if (!existingRecording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    if (existingRecording.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextVisibility = visibility || existingRecording.visibility;

    // Update recording
    const recording = await prisma.recording.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(emotions && { emotions }),
        ...(location !== undefined && { location }),
        ...(visibility && { visibility }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const existingBoard = await prisma.board.findUnique({
      where: { recordingId: recording.id },
    });

    if (shouldPublishToBoard(nextVisibility)) {
      const boardData = {
        title: recording.title,
        content: recording.description,
        audioUrl: recording.audioUrl,
        duration: Math.round(recording.duration),
        authorId: user.id,
        isPublic: nextVisibility === "public",
      };

      if (existingBoard) {
        await prisma.board.update({
          where: { id: existingBoard.id },
          data: boardData,
        });
      } else {
        await prisma.board.create({
          data: {
            ...boardData,
            recordingId: recording.id,
          },
        });
      }
    } else if (existingBoard) {
      await prisma.board.delete({
        where: { id: existingBoard.id },
      });
    }

    return NextResponse.json({ recording });
  } catch (error: any) {
    console.error("Update recording error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a recording
export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    // Check if recording exists and belongs to user
    const recording = await prisma.recording.findUnique({
      where: { id },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    if (recording.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete recording (cascades will handle related records)
    await prisma.recording.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete recording error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
