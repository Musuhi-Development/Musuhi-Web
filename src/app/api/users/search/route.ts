import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const searchUsersSchema = z.object({
  q: z.string().min(1, "検索クエリは必須です。"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const validation = searchUsersSchema.safeParse({ q: searchParams.get("q") });

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const query = validation.data.q;
    const normalizedQuery = query.trim().toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: { equals: query } },
              { name: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          { id: { not: user.id } }, // 自分自身は除外
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        email: true,
      },
      take: 20, // 最大20件まで
    });

    const uniqueUsers = Array.from(
      new Map(users.map((user) => [user.id, user])).values()
    );

    const results = uniqueUsers.map((user) => {
      const matchedBy: string[] = [];
      if (user.displayName && user.displayName.toLowerCase().includes(normalizedQuery)) {
        matchedBy.push("displayName");
      }
      if (user.name && user.name.toLowerCase().includes(normalizedQuery)) {
        matchedBy.push("name");
      }
      if (user.email && user.email.toLowerCase().includes(normalizedQuery)) {
        matchedBy.push("email");
      }
      if (user.id === query) {
        matchedBy.push("id");
      }

      return {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        matchedBy,
      };
    });

    return NextResponse.json({ users: results });

  } catch (error: any) {
    console.error("User search error:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
    }
    return NextResponse.json({ error: "ユーザーの検索中にエラーが発生しました。" }, { status: 500 });
  }
}
