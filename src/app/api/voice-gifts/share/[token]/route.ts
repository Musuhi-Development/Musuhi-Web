import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params;

    const voiceGift = await prisma.voiceGift.findUnique({
      where: { shareToken: token },
      include: {
        owner: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        recordings: {
          include: {
            recording: { select: { id: true, title: true, duration: true, audioUrl: true, description: true, images: true, emotions: true, createdAt: true } },
            contributor: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!voiceGift) {
      return NextResponse.json({ error: "Voice gift not found" }, { status: 404 });
    }

    const uniqueContributors = Array.from(
      new Map(
        voiceGift.recordings.map((r) => [r.contributor.id, r.contributor])
      ).values()
    );

    return NextResponse.json({
      voiceGift: {
        id: voiceGift.id,
        title: voiceGift.title,
        message: voiceGift.message,
        senderName: voiceGift.senderName,
        status: voiceGift.status,
        sendAt: voiceGift.sendAt,
        owner: voiceGift.owner,
        recordingCount: voiceGift.recordings.length,
        recordings: voiceGift.recordings.map((r) => ({
          id: r.id,
          title: r.recording.title,
          duration: r.recording.duration,
          audioUrl: r.recording.audioUrl,
          description: r.recording.description,
          images: r.recording.images,
          emotions: r.recording.emotions,
          createdAt: r.recording.createdAt,
          contributorId: r.contributor.id,
          contributorName: r.contributor.displayName ?? r.contributor.name,
          contributorAvatarUrl: r.contributor.avatarUrl,
        })),
        contributors: uniqueContributors.map((c) => ({
          id: c.id,
          name: c.displayName ?? c.name,
          avatarUrl: c.avatarUrl,
        })),
      },
    });
  } catch (error: any) {
    console.error("Get voice gift share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
