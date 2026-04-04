"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Loader2, UserPlus, LogIn } from "lucide-react";

export default function GiftSharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string | undefined;
  const [gift, setGift] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchShare();
  }, [token]);

  async function fetchShare() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/voice-gifts/share/${token}`);
      if (!res.ok) {
        throw new Error("ボイスギフトが見つかりません");
      }
      const data = await res.json();
      setGift(data.voiceGift);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#2A5CAA]" />
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-red-500 mb-4">{error || "ボイスギフトが見つかりません"}</p>
        <button onClick={() => router.push("/login")} className="text-[#2A5CAA] font-medium">
          ログインへ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-lg p-6 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] rounded-2xl mx-auto flex items-center justify-center text-white mb-4">
          <Gift size={28} />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">{gift.title}</h1>
        <p className="text-sm text-gray-600 mb-4">
          {gift.owner?.displayName || gift.owner?.name || "オーナー"} さんがボイスギフトを作成しました。
        </p>
        {gift.message && (
          <p className="text-sm text-gray-500 mb-6">{gift.message}</p>
        )}
        <div className="space-y-3">
          <Link href={`/signup?giftToken=${token}`} className="w-full inline-flex items-center justify-center gap-2 bg-[#2A5CAA] text-white py-3 rounded-full font-semibold">
            <UserPlus size={18} />
            アカウントを作成して参加
          </Link>
          <Link href={`/login?giftToken=${token}`} className="w-full inline-flex items-center justify-center gap-2 border border-[#2A5CAA] text-[#2A5CAA] py-3 rounded-full font-semibold">
            <LogIn size={18} />
            すでにアカウントを持っている
          </Link>
        </div>
      </div>
    </div>
  );
}
