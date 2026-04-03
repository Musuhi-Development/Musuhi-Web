"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, Users } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

type Anniversary = {
  label?: string;
  date?: string;
};

type UserProfile = {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  birthday: string | null;
  anniversaries: Anniversary[] | null;
  _count: {
    recordings: number;
    sentGifts: number;
    receivedGifts: number;
    boards: number;
    connectionsInitiated: number;
    connectionsReceived: number;
  };
};

export default function OtherProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchUserProfile(userId);
  }, [userId]);

  const totalConnections = useMemo(() => {
    if (!user) return 0;
    return user._count.connectionsInitiated + user._count.connectionsReceived;
  }, [user]);

  const totalGifts = useMemo(() => {
    if (!user) return 0;
    return user._count.sentGifts + user._count.receivedGifts;
  }, [user]);

  async function fetchUserProfile(id: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${id}`);

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.status === 403) {
        setError("このユーザーのプロフィールを閲覧する権限がありません");
        return;
      }

      if (!res.ok) {
        throw new Error("プロフィールの取得に失敗しました");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <PageHeader title="プロフィール" showBackButton={true} />
        <div className="text-center py-20 px-6">
          <p className="text-red-500 mb-4">{error || "ユーザー情報が見つかりません"}</p>
          <button
            onClick={() => userId && fetchUserProfile(userId)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.displayName || user.name || "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="プロフィール" showBackButton={true} />

      <div className="px-6 py-8">
        <div className="bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] rounded-3xl p-6 text-white shadow-lg mb-6">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-[#2A5CAA] text-4xl font-bold overflow-hidden shadow-lg mb-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
            </div>

            <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
            <p className="text-sm opacity-90 mb-3">@{user.name}</p>

            {user.bio && (
              <p className="text-sm text-center max-w-xs opacity-95 bg-white bg-opacity-20 rounded-2xl px-4 py-2">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-md">
            <p className="text-2xl font-bold text-gray-800">{user._count.recordings}</p>
            <p className="text-xs text-gray-500 mt-1">ジャーナル</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md">
            <p className="text-2xl font-bold text-gray-800">{totalConnections}</p>
            <p className="text-xs text-gray-500 mt-1">つながり</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md">
            <p className="text-2xl font-bold text-gray-800">{totalGifts}</p>
            <p className="text-xs text-gray-500 mt-1">ギフト</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-full flex items-center justify-between p-5 bg-white rounded-2xl shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center shadow-md">
                <Users size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">誕生日</p>
                <p className="text-sm text-gray-600">{user.birthday ? formatDate(user.birthday) : "未設定"}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>

          <div className="w-full p-5 bg-white rounded-2xl shadow-md">
            <p className="font-semibold text-gray-800 mb-2">記念日</p>
            {!user.anniversaries || user.anniversaries.length === 0 ? (
              <p className="text-sm text-gray-500">未設定</p>
            ) : (
              <div className="space-y-2">
                {user.anniversaries.map((anniversary, index) => {
                  if (!anniversary?.label) return null;
                  return (
                    <div key={`${anniversary.label}-${index}`} className="text-sm text-gray-700">
                      {anniversary.label}
                      {anniversary.date ? `: ${formatDate(anniversary.date)}` : ""}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
