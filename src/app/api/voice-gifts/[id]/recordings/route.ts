import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { recordingId, message } = body;

    if (!recordingId) {
      return NextResponse.json({ error: "recordingId is required" }, { status: 400 });
    }

    const voiceGift = await prisma.voiceGift.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!voiceGift) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    if (voiceGift.status === "sent" || voiceGift.status === "canceled") {
      return NextResponse.json(
        { error: "Voice gift is not accepting recordings" },
        { status: 400 }
      );
    }

    const isParticipant =
      voiceGift.ownerId === user.id ||
      voiceGift.participants.some((p: { userId: string }) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recording = await prisma.recording.findUnique({ where: { id: recordingId } });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    if (recording.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only attach your own recordings" },
        { status: 403 }
      );
    }

    const voiceGiftRecording = await prisma.voiceGiftRecording.create({
      data: {
        voiceGiftId: id,
        recordingId,
        contributorId: user.id,
        message: message || null,
      },
      include: {
        recording: true,
        contributor: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ voiceGiftRecording }, { status: 201 });
  } catch (error: any) {
    console.error("Add voice gift recording error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
