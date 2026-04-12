import { NextResponse } from "next/server";
import { isUnauthorizedError, requireAuth } from "@/lib/auth";

const FALLBACK_PROMPT = {
  headline: "こんなことを録音してみませんか？",
  message: "今日のあなたの気持ちを声にしてみよう",
  recordingText: "今日いちばん心に残ったこと",
  source: "fallback",
};

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function GET() {
  try {
    const user = await requireAuth();

    const baseUrl = normalizeBaseUrl(
      process.env.MUSUHI_AI_API_URL || "http://localhost:8010"
    );
    const endpoint = `${baseUrl}/api/v1/journaling/prompt?userId=${encodeURIComponent(user.id)}`;

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (process.env.MUSUHI_AI_API_KEY) {
      headers["x-api-key"] = process.env.MUSUHI_AI_API_KEY;
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch journaling prompt from AI API", response.status);
      return NextResponse.json(FALLBACK_PROMPT, { status: 200 });
    }

    const payload = await response.json();
    return NextResponse.json(
      {
        headline: payload.headline || FALLBACK_PROMPT.headline,
        message: payload.message || FALLBACK_PROMPT.message,
        recordingText: payload.recordingText || FALLBACK_PROMPT.recordingText,
        source: payload.source || "ai-api",
      },
      { status: 200 }
    );
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get journaling prompt error:", error);
    return NextResponse.json(FALLBACK_PROMPT, { status: 200 });
  }
}
