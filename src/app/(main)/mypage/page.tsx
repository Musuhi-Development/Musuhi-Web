"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Users, ChevronRight, Edit3, Loader2, ArrowLeft } from "lucide-react";

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
  const [recordings, setRecordings] = useState<any[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchRecordings();
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

  async function fetchRecordings() {
    setAnalysisLoading(true);
    try {
      const response = await fetch("/api/recordings");
      if (response.ok) {
        const data = await response.json();
        setRecordings(data.recordings || []);
      }
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
    } finally {
      setAnalysisLoading(false);
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

  const todayRecordings = recordings.filter((recording) => {
    const today = new Date();
    const recordingDate = new Date(recording.createdAt);
    return recordingDate.toDateString() === today.toDateString();
  });

  const allEmotions = recordings.flatMap((recording) => recording.emotions || []);
  const dominantEmotion = allEmotions.length > 0
    ? allEmotions.reduce((a, b, i, arr) =>
        arr.filter((v: string) => v === a).length >= arr.filter((v: string) => v === b).length ? a : b
      )
    : "嬉しい";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold text-[#2A5CAA]">Profile</h1>
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

          {user.birthday && (
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              🎂 {formatDate(user.birthday)}
            </p>
          )}

          {user.anniversaries && user.anniversaries.length > 0 && (
            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
              {user.anniversaries.map((a, i) => {
                if (!a?.label) return null;
                return (
                  <p key={`${a.label}-${i}`} className="flex items-center gap-1 justify-center">
                    ✨ {a.label}{a.date ? `: ${formatDate(a.date)}` : ""}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Analysis */}
        <div className="bg-white rounded-3xl p-6 shadow-md mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">今日の分析</h3>
            <span className="text-xs text-gray-400">My Page</span>
          </div>
          {analysisLoading ? (
            <div className="text-sm text-gray-500">読み込み中...</div>
          ) : recordings.length === 0 ? (
            <div className="text-sm text-gray-500">まだ録音がありません。</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">😊</div>
                  <p className="text-xs text-gray-600 mb-1">今日の気分</p>
                  <p className="text-sm font-bold text-gray-800">良好</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">
                    {emotionToAnimal[dominantEmotion] ? (
                      <img src={emotionToAnimal[dominantEmotion]} alt={dominantEmotion} className="w-8 h-8 mx-auto object-contain" />
                    ) : "🎵"}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">感情動物</p>
                  <p className="text-sm font-bold text-gray-800">{dominantEmotion}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">今日</p>
                  <p className="text-3xl font-bold text-gray-800">{todayRecordings.length}</p>
                  <p className="text-xs text-gray-600">件</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-600 mb-2 font-medium">AIコメント</p>
                <p className="text-sm leading-relaxed text-gray-700">
                  今日は{dominantEmotion}の気持ちを感じる一日でしたね。周りの人との繋がりを大切にしている様子が伺えます。
                </p>
              </div>
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
              <span className="font-semibold text-gray-800">つながりリスト ({totalConnections}人)</span>
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
              <span className="font-semibold text-gray-800">アカウント設定</span>
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
