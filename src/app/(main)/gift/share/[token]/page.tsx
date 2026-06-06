"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Loader2, UserPlus, LogIn, Lock } from "lucide-react";

type Contributor = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

type RecordingPreview = {
  id: string;
  title: string;
  duration: number;
  contributorName: string | null;
  contributorAvatarUrl: string | null;
};

type GiftShare = {
  id: string;
  title: string;
  message: string | null;
  status: string;
  sendAt: string | null;
  owner: { id: string; name: string | null; displayName: string | null; avatarUrl: string | null };
  recordingCount: number;
  recordings: RecordingPreview[];
  contributors: Contributor[];
};

function AvatarChip({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initial = (name ?? "?").charAt(0);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name ?? ""} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <span className="text-xs text-gray-600 font-medium">{name ?? "ユーザー"}</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2A5CAA]" />
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5] flex flex-col items-center justify-center px-6">
        <p className="text-red-500 mb-4">{error || "ボイスギフトが見つかりません"}</p>
        <button onClick={() => router.push("/login")} className="text-[#2A5CAA] font-medium">
          ログインへ
        </button>
      </div>
    );
  }

  const isSent = gift.status === "sent";
  const ownerName = gift.owner?.displayName || gift.owner?.name || "オーナー";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBF2FF] to-[#E3EAF5] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">

        {/* ヘッダーカード */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#4A7BC8] to-[#2A5CAA] px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium">Musuhi Voice Gift</p>
              <p className="text-white font-bold text-base leading-tight">{gift.title}</p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                {gift.owner.avatarUrl ? (
                  <img src={gift.owner.avatarUrl} alt={ownerName} className="w-full h-full object-cover" />
                ) : (
                  ownerName.charAt(0)
                )}
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-[#1F4580]">{ownerName}</span>
                {isSent ? " さんから声のギフトが届いています" : " さんが声のギフト作りに招待しています"}
              </p>
            </div>

            {gift.message && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                {gift.message}
              </p>
            )}
          </div>
        </div>

        {/* 録音ティーザーカード */}
        {gift.recordingCount > 0 && (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/icons/mic.png" alt="" className="w-4 h-4 object-contain" />
                <span className="text-sm font-bold text-gray-700">収録された音声</span>
              </div>
              <span className="text-xs bg-[#EBF2FF] text-[#2A5CAA] font-bold px-2.5 py-0.5 rounded-full">
                {gift.recordingCount}件
              </span>
            </div>

            <div className="px-4 pb-4 space-y-2">
              {gift.recordings.map((rec, i) => (
                <div
                  key={rec.id}
                  className="relative flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 overflow-hidden"
                >
                  {/* ロックオーバーレイ */}
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-end pr-4 z-10">
                    <Lock size={14} className="text-[#2A5CAA]/60" />
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EBF2FF] to-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                    <img src="/icons/mic.png" alt="" className="w-3.5 h-3.5 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{rec.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {rec.contributorName && (
                        <span className="text-[11px] text-gray-500">{rec.contributorName}</span>
                      )}
                      {rec.duration > 0 && (
                        <span className="text-[11px] text-gray-400">{formatDuration(rec.duration)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-center text-xs text-gray-400 pt-1">
                アカウントを作成すると音声を聴くことができます
              </p>
            </div>
          </div>
        )}

        {/* 送信者カード */}
        {gift.contributors.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg px-5 py-4">
            <p className="text-sm font-bold text-gray-700 mb-3">声を届けてくれた人</p>
            <div className="flex flex-wrap gap-3">
              {gift.contributors.map((c) => (
                <AvatarChip key={c.id} name={c.name} avatarUrl={c.avatarUrl} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3 pt-1">
          <Link
            href={`/signup?giftToken=${token}`}
            className="w-full flex items-center justify-center gap-2 bg-[#2A5CAA] text-white py-3.5 rounded-full font-bold text-sm shadow-lg shadow-[#2A5CAA]/30"
          >
            <UserPlus size={18} />
            {isSent ? "アカウントを作成してギフトを開く" : "アカウントを作成して参加"}
          </Link>
          <Link
            href={`/login?giftToken=${token}`}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[#2A5CAA] text-[#2A5CAA] py-3.5 rounded-full font-bold text-sm"
          >
            <LogIn size={18} />
            すでにアカウントをお持ちの方
          </Link>
        </div>

        <p className="text-center text-[11px] text-gray-400">Musuhi — 声でつながる、心のギフト</p>
      </div>
    </div>
  );
}
