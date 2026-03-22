import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password, name, avatarUrl } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 }
      );
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
          display_name: name || null,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const signupEmail = data.user.email!;

    // 既存emailが別IDで存在する場合は競合として扱う
    const existingByEmail = await prisma.user.findUnique({
      where: { email: signupEmail },
    });

    if (existingByEmail && existingByEmail.id !== data.user.id) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録済みです。ログインしてください。" },
        { status: 409 }
      );
    }

    // Create or sync user in our database
    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email: signupEmail,
        name: name || null,
        displayName: name || null,
        avatarUrl: avatarUrl || null,
      },
      update: {
        email: signupEmail,
        ...(name !== undefined && { name: name || null }),
        ...(name !== undefined && { displayName: name || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
      },
    });

    const hasSession = Boolean(data.session);

    // Set cookies with session tokens
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
      },
      sessionCreated: hasSession,
      emailConfirmationRequired: !hasSession,
    });

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
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
