"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Users, ChevronRight, Edit3, Loader2 } from "lucide-react";

type Anniversary = {
  label?: string;
  date?: string;
};

type UserProfile = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me");
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("プロフィールの取得に失敗しました");
      }
      
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しましました");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      
      if (res.ok) {
        router.push("/login");
      } else {
        alert("ログアウトに失敗しました");
      }
    } catch (err) {
      alert("ログアウトに失敗しました");
    }
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
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error || "ユーザー情報が見つかりません"}</p>
        <button 
          onClick={fetchUserProfile}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  const displayName = user.displayName || user.name || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const totalConnections = user._count.connectionsInitiated + user._count.connectionsReceived;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#2A5CAA]">My Page</h1>
          </div>
          <button
            onClick={() => router.push('/mypage/settings')}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold overflow-hidden hover:bg-gray-300 transition-colors"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayInitial
            )}
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-8">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-4xl font-bold overflow-hidden shadow-md">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayInitial
              )}
            </div>
            <button
              onClick={() => router.push('/mypage/edit')}
              className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg text-[#2A5CAA] hover:bg-gray-50 transition-colors"
            >
              <Edit3 size={16} />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">{displayName}</h2>
          <p className="text-sm text-gray-500 mb-3">@{user.name}</p>

          {user.bio && (
            <p className="text-sm text-center max-w-xs text-gray-600 bg-gray-50 rounded-2xl px-4 py-2">
              {user.bio}
            </p>
          )}

          {(user.birthday || (user.anniversaries && user.anniversaries.length > 0)) && (
            <div className="flex gap-2 mt-3 w-full max-w-xs">
              {user.birthday && (
                <div className="flex-none w-24 bg-white rounded-2xl shadow-sm border border-blue-100 px-2 py-2.5">
                  <p className="text-[10px] font-bold text-[#1e50a2] mb-1.5">🎂 誕生日</p>
                  <p className="text-[11px] text-gray-700 leading-tight">{formatDate(user.birthday)}</p>
                </div>
              )}
              {user.anniversaries && user.anniversaries.length > 0 && (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-blue-100 px-3 py-2.5">
                  <p className="text-[10px] font-bold text-[#1e50a2] mb-1.5">🌸 大切な日</p>
                  <div className="space-y-0.5">
                    {user.anniversaries.map((a, i) => {
                      if (!a?.label) return null;
                      return (
                        <p key={`${a.label}-${i}`} className="text-xs text-gray-600 whitespace-nowrap">
                          {a.label}{a.date ? `: ${formatDate(a.date)}` : ""}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <button 
            onClick={() => router.push('/mypage/connections')}
            className="w-full flex items-center justify-between p-5 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center shadow-md">
                <Users size={20} />
              </div>
              <span className="font-semibold text-gray-800">つながり ({totalConnections}人)</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button 
            onClick={() => router.push('/mypage/settings')}
            className="w-full flex items-center justify-between p-5 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] text-white flex items-center justify-center shadow-md">
                <Settings size={20} />
              </div>
              <span className="font-semibold text-gray-800">設定</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleLogout}
            className="text-sm text-red-500 font-medium px-6 py-2 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
