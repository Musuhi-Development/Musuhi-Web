import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { title, description, audioUrl, duration, emotions, visibility, location } = body;

    // Validation
    if (!title || !audioUrl || duration === undefined) {
      return NextResponse.json(
        { error: "Title, audioUrl, and duration are required" },
        { status: 400 }
      );
    }

    // Create recording
    const recording = await prisma.recording.create({
      data: {
        title,
        description: description || null,
        audioUrl,
        duration,
        emotions: emotions || [],
        visibility: visibility || "private",
        location: location || null,
        userId: user.id,
      },
    });

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
