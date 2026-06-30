import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const giftToken = searchParams.get("giftToken");
  const returnTitle = searchParams.get("returnTitle");

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Collect cookies to set on the response (PKCE verifier needs request cookies)
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!data?.user?.email) {
      console.error("Auth callback returned user without email");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Determine redirect destination (gift/returnTitle params take priority)
    let redirectPath: string;
    if (returnTitle) {
      redirectPath = `/gift/new?title=${encodeURIComponent(returnTitle)}`;
    } else if (giftToken) {
      redirectPath = `/gift/share/${giftToken}`;
    } else {
      // New users → profile creation, existing users → home
      const existingUser = await prisma.user.findUnique({
        where: { email: data.user.email },
      });
      redirectPath = existingUser ? "/home" : "/mypage/edit";

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || null,
            displayName:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          },
        });
      }
    }

    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    // Apply cookies collected by @supabase/ssr (includes PKCE cleanup)
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    });

    // Set our custom session cookies that getSessionUser() reads
    if (data.session) {
      response.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
