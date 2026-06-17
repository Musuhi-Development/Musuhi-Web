import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const contributionInclude = {
  contributor: {
    select: { id: true, name: true, displayName: true, avatarUrl: true },
  },
  recording: true,
};

// POST: Add contribution (認証不要 — 未登録ユーザーも投稿可)
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const body = await request.json();
    const { recordingId, participantName, imageUrl, audioUrl, audioDuration, title, message } = body;

    const yosegaki = await prisma.yosegaki.findUnique({ where: { id } });
    if (!yosegaki) {
      return NextResponse.json({ error: "Yosegaki not found" }, { status: 404 });
    }
    if (yosegaki.status !== "collecting") {
      return NextResponse.json({ error: "Yosegaki is not accepting contributions" }, { status: 400 });
    }
    if (yosegaki.deadline && new Date() > yosegaki.deadline) {
      return NextResponse.json({ error: "募集期限が過ぎています" }, { status: 400 });
    }

    if (recordingId && user) {
      const recording = await prisma.recording.findUnique({ where: { id: recordingId } });
      if (!recording) {
        return NextResponse.json({ error: "Recording not found" }, { status: 404 });
      }
      if (recording.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // participantName を明示的に指定した場合は優先（ユーザー名の上書きを許可）
    const resolvedName = participantName?.trim() || (user ? (user.displayName || user.name) : null) || "名前なし";

    // ログイン済みユーザーが既に contribution を持つ場合は upsert（placeholder の上書き含む）
    if (user) {
      const existing = await prisma.yosegakiContribution.findFirst({
        where: { yosegakiId: id, contributorId: user.id },
      });
      if (existing) {
        const updated = await prisma.yosegakiContribution.update({
          where: { id: existing.id },
          data: {
            recordingId: recordingId || null,
            participantName: resolvedName,
            imageUrl: imageUrl || null,
            audioUrl: audioUrl || null,
            audioDuration: audioDuration || null,
            title: title || null,
            message: message || null,
          },
          include: contributionInclude,
        });
        return NextResponse.json({ contribution: updated });
      }
    }

    const contribution = await prisma.yosegakiContribution.create({
      data: {
        yosegakiId: id,
        recordingId: recordingId || null,
        contributorId: user ? user.id : null,
        participantName: resolvedName,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        audioDuration: audioDuration || null,
        title: title || null,
        message: message || null,
      },
      include: contributionInclude,
    });

    return NextResponse.json({ contribution }, { status: 201 });
  } catch (error: any) {
    console.error("Add contribution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update own contribution
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const body = await request.json();
    const { contributionId, imageUrl, audioUrl, audioDuration, title, message, participantName } = body;

    if (!contributionId) {
      return NextResponse.json({ error: "contributionId is required" }, { status: 400 });
    }

    const contribution = await prisma.yosegakiContribution.findUnique({
      where: { id: contributionId },
      include: { yosegaki: true },
    });
    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }
    if (user && contribution.contributorId && contribution.contributorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (contribution.yosegaki.deadline && new Date() > contribution.yosegaki.deadline) {
      return NextResponse.json({ error: "募集期限が過ぎています" }, { status: 400 });
    }

    const updated = await prisma.yosegakiContribution.update({
      where: { id: contributionId },
      data: {
        ...(imageUrl !== undefined && { imageUrl }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(audioDuration !== undefined && { audioDuration }),
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(participantName !== undefined && { participantName }),
      },
      include: contributionInclude,
    });

    return NextResponse.json({ contribution: updated });
  } catch (error: any) {
    console.error("Update contribution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove contribution
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const contributionId = searchParams.get("contributionId");

    if (!contributionId) {
      return NextResponse.json({ error: "contributionId is required" }, { status: 400 });
    }

    const contribution = await prisma.yosegakiContribution.findUnique({
      where: { id: contributionId },
    });
    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }
    if (user && contribution.contributorId && contribution.contributorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.yosegakiContribution.delete({ where: { id: contributionId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete contribution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
