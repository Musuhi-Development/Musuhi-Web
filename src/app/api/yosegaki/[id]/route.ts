import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const yosegakiInclude = {
  creator: {
    select: { id: true, name: true, displayName: true, avatarUrl: true },
  },
  contributions: {
    orderBy: { createdAt: "asc" as const },
    include: {
      contributor: {
        select: { id: true, name: true, displayName: true, avatarUrl: true },
      },
      recording: true,
    },
  },
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    const yosegaki = await prisma.yosegaki.findUnique({
      where: { id },
      include: yosegakiInclude,
    });

    if (!yosegaki) {
      return NextResponse.json({ error: "Yosegaki not found" }, { status: 404 });
    }

    const isCreator = user && yosegaki.creatorId === user.id;
    const hasContributed = user && yosegaki.contributions.some((c) => c.contributorId === user.id);

    if (!isCreator && !hasContributed && !yosegaki.isPublic && yosegaki.status !== "delivered") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ yosegaki });
  } catch (error: any) {
    console.error("Get yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.yosegaki.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Yosegaki not found" }, { status: 404 });
    }
    if (existing.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      title,
      description,
      status,
      deliverAt,
      organizerName,
      organizerComment,
      organizerImageUrl,
      organizerAudioUrl,
      organizerAudioTitle,
      organizerAudioComment,
      deadline,
      isPublic,
    } = body;

    const yosegaki = await prisma.yosegaki.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(deliverAt !== undefined && { deliverAt: deliverAt ? new Date(deliverAt) : null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(organizerName !== undefined && { organizerName }),
        ...(organizerComment !== undefined && { organizerComment }),
        ...(organizerImageUrl !== undefined && { organizerImageUrl }),
        ...(organizerAudioUrl !== undefined && { organizerAudioUrl }),
        ...(organizerAudioTitle !== undefined && { organizerAudioTitle }),
        ...(organizerAudioComment !== undefined && { organizerAudioComment }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: yosegakiInclude,
    });

    return NextResponse.json({ yosegaki });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const yosegaki = await prisma.yosegaki.findUnique({ where: { id } });
    if (!yosegaki) {
      return NextResponse.json({ error: "Yosegaki not found" }, { status: 404 });
    }
    if (yosegaki.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.yosegaki.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete yosegaki error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
