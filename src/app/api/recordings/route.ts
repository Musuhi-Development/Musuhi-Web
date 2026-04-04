import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function shouldPublishToBoard(visibility: string) {
  return visibility === "public" || visibility === "friends";
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { title, description, audioUrl, duration, emotions, images, visibility, location } = body;

    // Validation
    if (!title || !audioUrl || duration === undefined) {
      return NextResponse.json(
        { error: "Title, audioUrl, and duration are required" },
        { status: 400 }
      );
    }

    const normalizedVisibility = visibility || "private";

    // Create recording
    const recording = await prisma.recording.create({
      data: {
        title,
        description: description || null,
        audioUrl,
        duration,
        emotions: emotions || [],
        images: Array.isArray(images) ? images : [],
        visibility: normalizedVisibility,
        location: location || null,
        userId: user.id,
      },
    });

    if (shouldPublishToBoard(normalizedVisibility)) {
      await prisma.board.create({
        data: {
          title: recording.title,
          content: recording.description,
          audioUrl: recording.audioUrl,
          duration: Math.round(recording.duration),
          recordingId: recording.id,
          authorId: user.id,
          isPublic: normalizedVisibility === "public",
        },
      });
    }

    return NextResponse.json({ recording }, { status: 201 });
  } catch (error: any) {
    console.error("Create recording error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    console.log("Authenticated user ID:", user.id); // 認証ユーザーIDをログ出力

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const recordings = await prisma.recording.findMany({
      where: userId ? { userId } : { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${recordings.length} recordings.`); // 取得件数をログ出力

    return NextResponse.json({ recordings });
  } catch (error: any) {
    console.error("Get recordings error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
