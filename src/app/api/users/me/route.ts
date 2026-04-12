import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUnauthorizedError, requireAuth } from "@/lib/auth";

// GET: Get current user profile
export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            recordings: true,
            sentGifts: true,
            receivedGifts: true,
            boards: true,
            connectionsInitiated: {
              where: { status: "accepted" },
            },
            connectionsReceived: {
              where: { status: "accepted" },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: profile });
  } catch (error: any) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get user profile error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update current user profile
export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { displayName, bio, location, avatarUrl, birthday, anniversaries } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
        ...(anniversaries !== undefined && { anniversaries }),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Update user profile error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update current user profile
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, displayName, bio, location, avatarUrl, birthday, anniversaries } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
        ...(anniversaries !== undefined && { anniversaries }),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Update user profile error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
