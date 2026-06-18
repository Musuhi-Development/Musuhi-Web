"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { MizuhikiBow } from "@/components/shared/MizuhikiBow";

const emotionToAnimal: { [key: string]: string } = {
  "嬉しい": "/animal/dog.png",
  "感謝": "/animal/rabbit.png",
  "楽しい": "/animal/horse.png",
  "幸せ": "/animal/cat.png",
  "ワクワク": "/animal/lion.png",
  "応援": "/animal/tiger.png",
  "疲れた": "/animal/monkey.png",
  "悲しい": "/animal/turtle.png",
  "イライラ": "/animal/bear.png",
};

type RecordingItem = {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  description: string | null;
  images: unknown;
  emotions: unknown;
  createdAt: string;
  contributorId: string;
  contributorName: string | null;
  contributorAvatarUrl: string | null;
};

type GiftShare = {
  id: string;
  title: string;
  message: string | null;
  senderName: string | null;
  status: string;
  sendAt: string | null;
  owner: { id: string; name: string | null; displayName: string | null; avatarUrl: string | null };
  recordingCount: number;
  recordings: RecordingItem[];
  contributors: { id: string; name: string | null; avatarUrl: string | null }[];
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function GiftSharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string | undefined;
  const [gift, setGift] = useState<GiftShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/voice-gifts/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("ボイスギフトが見つかりません");
        return res.json();
      })
      .then((data) => setGift(data.voiceGift))
      .catch((err) => setError(err instanceof Error ? err.message : "エラーが発生しました"))
      .finally(() => setLoading(false));
  }, [token]);

  const isCollab = useMemo(() => {
    if (!gift) return false;
    const ids = new Set((gift.recordings || []).map((r) => r.contributorId).filter(Boolean));
    return ids.size > 1;
  }, [gift]);

  const repRec = gift?.recordings?.[0];

  const repImage = useMemo(() => {
    const images = repRec?.images;
    return Array.isArray(images) && images.length > 0 ? (images[0] as string) : null;
  }, [repRec]);

  const repEmotions: string[] = useMemo(() => {
    const e = repRec?.emotions;
    return Array.isArray(e) ? (e as string[]) : [];
  }, [repRec]);

  const repDescription = repRec?.description || "";

  const displayTitle = useMemo(() => {
    const t = repRec?.title;
    return t && String(t).trim() ? t : "無題";
  }, [repRec]);

  const senderDisplayName = useMemo(() => {
    if (!gift) return "";
    return gift.senderName || gift.owner?.displayName || gift.owner?.name || "贈り主";
  }, [gift]);

  const returnTitle = encodeURIComponent(senderDisplayName);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#2A5CAA]" />
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "ボイスギフトが見つかりません"}</p>
        <button onClick={() => router.push("/login")} className="text-[#2A5CAA] font-medium">
          ログインへ
        </button>
      </div>
    );
  }

  const isSent = gift.status === "sent";

  return (
    <div className="zen-kaku min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="w-8" />
          <h1 className="text-lg font-bold text-gray-800">ボイスギフト</h1>
          <span className="w-8" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ポラロイドカード — authenticated 詳細ページと同一UI */}
        <div
          className="relative bg-[#F3EBDD] rounded-2xl p-5 sm:p-7 shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
            backgroundSize: "5px 5px",
            backgroundPosition: "0 0, 2.5px 2.5px",
          }}
        >
          <div className="relative bg-white rounded-[3px] px-5 sm:px-6 pt-6 pb-6 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.25)]">
            {/* クラフト紙テープ */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 rotate-[-3deg] z-20 bg-[#9CB38D] shadow-[0_3px_6px_-1px_rgba(0,0,0,0.22),inset_0_0_10px_rgba(60,75,50,0.18)]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
                backgroundSize: "3px 3px, auto",
              }}
              aria-hidden="true"
            />

            {/* 写真 */}
            {repImage ? (
              <img
                src={repImage}
                alt={displayTitle}
                className="w-full rounded-sm object-cover max-h-64 sm:max-h-72 ring-1 ring-black/[0.07]"
              />
            ) : (
              <div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center ring-1 ring-black/[0.07]">
                {repEmotions.length > 0 && emotionToAnimal[repEmotions[0]] ? (
                  <img src={emotionToAnimal[repEmotions[0]]} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-6xl">🎵</span>
                )}
              </div>
            )}

            <div className="pt-4 px-1 space-y-3 pb-3">
              <p className="text-lg font-bold text-gray-800 tracking-wide leading-snug pr-9">
                {displayTitle}
              </p>

              {repDescription && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {repDescription}
                </p>
              )}

              {/* 音声プレイヤー */}
              {gift.recordings.length === 0 ? (
                <p className="text-sm text-gray-500">まだ音声がありません</p>
              ) : (
                <div className="space-y-2">
                  {gift.recordings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-transparent border border-[#1e50a2]/30 px-3 py-2.5"
                    >
                      {isCollab && (
                        <p className="text-[11px] text-gray-500 mb-1">
                          {item.contributorName || "ユーザー"}
                        </p>
                      )}
                      {item.audioUrl ? (
                        <WaveformPlayer src={item.audioUrl} duration={item.duration} />
                      ) : (
                        <p className="text-xs text-gray-400">{item.title}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {repEmotions.length > 0 && (
                <div className="flex flex-wrap gap-2 pr-10">
                  {repEmotions.map((emotion) => (
                    <span key={emotion} className="text-xs px-2 py-1 bg-blue-50 text-[#2A5CAA] rounded-full">
                      #{emotion}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 録音日時：ポラロイド右下 */}
            {repRec?.createdAt && (
              <p className="absolute bottom-3 right-4 text-[10px] text-gray-400 whitespace-nowrap">
                録音日：{formatDateTime(repRec.createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* 便箋エリア */}
        <div
          className="relative rounded-2xl bg-[#FAF7F2] shadow-sm px-6 sm:px-8 py-7 pb-12"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, rgba(120,95,55,0.10) 31px, rgba(120,95,55,0.10) 32px)",
          }}
        >
          <MizuhikiBow className="absolute top-3 right-4 w-24 h-7 opacity-80" />
          <p className="text-xl font-bold text-gray-800 mb-5">{gift.title}へ</p>
          <p className="text-[15px] text-gray-700 leading-[2rem] whitespace-pre-wrap min-h-[4rem]">
            {gift.message || ""}
          </p>
          {gift.senderName && (
            <p className="absolute bottom-3 right-4 text-sm text-gray-500 font-medium">
              {gift.senderName}より
            </p>
          )}
        </div>

        {/* お返しボタン */}
        {isSent && (
          <Link
            href={`/signup?returnTitle=${returnTitle}`}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c0873f] to-[#a06828] text-white py-4 rounded-full font-bold text-sm shadow-lg block text-center"
          >
            {senderDisplayName}さんにお返しのボイスギフトを贈る
          </Link>
        )}

        <p className="text-center text-[11px] text-gray-400">Musuhi — 声からはじまる　自分と人とのつながり</p>
      </div>
    </div>
  );
}
