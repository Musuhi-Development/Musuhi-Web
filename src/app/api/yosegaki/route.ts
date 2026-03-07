import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET: Get all yosegaki
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'created' or 'contributed'

    let where: any = {};

    if (type === "created") {
      where.creatorId = user.id;
    } else if (type === "contributed") {
      where.contributions = {
        some: {
          contributorId: user.id,
        },
      };
    } else {
      // All yosegaki
      where.OR = [
        { creatorId: user.id },
        {
          contributions: {
            some: {
              contributorId: user.id,
            },
          },
        },
      ];
    }

    const yosegakiList = await prisma.yosegaki.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        contributions: {
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
        },
      },
    });

    return NextResponse.json({ yosegakiList });
  } catch (error: any) {
    console.error("Get yosegaki error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new yosegaki
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { title, description, recipientName, recipientEmail, dueDate, isPublic } = body;

    if (!title || !recipientName) {
      return NextResponse.json(
        { error: "Title and recipientName are required" },
        { status: 400 }
      );
    }

    const yosegaki = await prisma.yosegaki.create({
      data: {
        title,
        description: description || null,
        recipientName,
        recipientEmail: recipientEmail || null,
        creatorId: user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublic: isPublic || false,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        contributions: true,
      },
    });

    return NextResponse.json({ yosegaki }, { status: 201 });
  } catch (error: any) {
    console.error("Create yosegaki error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
