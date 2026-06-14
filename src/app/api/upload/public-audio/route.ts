import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// 寄せ音声参加者向けの認証不要音声アップロードエンドポイント
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "ファイルサイズは10MB以内にしてください" }, { status: 400 });
    }

    const fileType = file.type || "audio/webm";
    if (!fileType.startsWith("audio/")) {
      return NextResponse.json({ error: "音声ファイルを選択してください" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop() || "webm";
    const filename = `public/${nanoid()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("voice-recordings")
      .upload(filename, buffer, {
        contentType: fileType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Public audio upload error:", error);
      return NextResponse.json({ error: "音声のアップロードに失敗しました" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("voice-recordings")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (error: any) {
    console.error("Public audio upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
