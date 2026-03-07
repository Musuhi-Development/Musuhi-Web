import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { email: data.user.email! },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || null,
        },
      });
    }

    // Set cookie and redirect
    const response = NextResponse.redirect(new URL("/home", request.url));
    response.cookies.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
