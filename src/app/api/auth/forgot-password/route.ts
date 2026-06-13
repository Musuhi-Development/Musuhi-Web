import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const redirectTo = `${appUrl}/reset-password`;

  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // メールアドレスの存在有無を漏洩しないため常に成功レスポンスを返す
  return NextResponse.json({ message: "sent" });
}
