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

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        name: name || null,
        displayName: name || null,
        avatarUrl: avatarUrl || null,
      },
    });

    // Set cookies with session tokens
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
      },
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
