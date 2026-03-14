import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { supabaseAdmin } from "./supabase";

export async function getCurrentUser(request?: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    if (!accessToken) {
      return null;
    }

    // Verify token with Supabase
    if (!supabaseAdmin) {
      console.error("Supabase is not configured");
      return null;
    }

    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !supabaseUser) {
      return null;
    }

    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth(request?: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
