import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// 公開投稿（寄せ音声参加）用の認証不要アップロードエンドポイント
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

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "ファイルサイズは5MB以内にしてください" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "JPEG・PNG・WebP・GIF形式の画像を選択してください" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `contributions/${nanoid()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("recording-images")
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Public upload error:", error);
      return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("recording-images")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (error: any) {
    console.error("Public upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
