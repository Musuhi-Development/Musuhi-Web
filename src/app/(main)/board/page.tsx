"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Play } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

type Board = {
  id: string;
  title: string;
  content: string | null;
  audioUrl: string | null;
  duration: number | null;
  isPublic: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
  likes: { id: string }[];
};

export default function BoardPage() {
  const [activeScope, setActiveScope] = useState<"all" | "friends">("all");
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchBoards();
  }, [activeScope]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }

  async function fetchBoards() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeScope === "all") {
        params.set("public", "true");
      }
      
      const res = await fetch(`/api/board?${params.toString()}`);
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("投稿の取得に失敗しました");
      }
      
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(boardId: string) {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const isLiked = board.likes.length > 0;
      const method = isLiked ? "DELETE" : "POST";
      
      const res = await fetch(`/api/board/${boardId}/like`, { method });
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("いいねに失敗しました");
      }
      
      // Optimistically update UI
      setBoards(prev => prev.map(b => {
        if (b.id === boardId) {
          return {
            ...b,
            likes: isLiked ? [] : [{ id: "temp" }],
            _count: {
              ...b._count,
              likes: b._count.likes + (isLiked ? -1 : 1),
            },
          };
        }
        return b;
      }));
    } catch (err) {
      console.error("Like error:", err);
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
    }
  }

  const filteredPosts = activeScope === "friends" 
    ? boards.filter(b => !b.isPublic)
    : boards;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Board</h1>
          <button 
            onClick={() => router.push('/mypage')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-all overflow-hidden"
          >
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.displayName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || "U"
            )}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveScope("all")}
            className={clsx(
              "px-4 py-2 text-sm rounded-full font-medium whitespace-nowrap transition-all",
              activeScope === "all" 
                ? "bg-[#2A5CAA] text-white shadow-md" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            全体
          </button>
          <button 
            onClick={() => setActiveScope("friends")}
            className={clsx(
              "px-4 py-2 text-sm rounded-full font-medium whitespace-nowrap transition-all",
              activeScope === "friends" 
                ? "bg-[#2A5CAA] text-white shadow-md" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            家族・友人/知人
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchBoards}
              className="px-6 py-2 bg-[#2A5CAA] text-white rounded-full hover:bg-[#1F4580] transition-colors shadow-md"
            >
              再試行
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl shadow-md">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600">投稿がありません</p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isLiked = post.likes.length > 0;
                const displayName = post.author.displayName || post.author.name;
                const initial = displayName[0].toUpperCase();
                
                return (
                  <article key={post.id} className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-shadow p-5">
                    {/* Author Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white font-bold shadow-md">
                        {post.author.avatarUrl ? (
                          <img 
                            src={post.author.avatarUrl} 
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className="font-bold text-lg mb-2 text-gray-900">{post.title}</h3>
                      {post.content && (
                        <p className="text-gray-600 leading-relaxed">{post.content}</p>
                      )}
                    </div>

                    {/* Audio Player Card */}
                    {post.audioUrl && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 flex items-center gap-3 mb-4 shadow-sm">
                        <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md text-[#2A5CAA] hover:text-[#1F4580] hover:shadow-lg transition-all">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </button>
                        <div className="flex-1 h-10 flex items-center gap-0.5">
                          {/* Fake Waveform */}
                          {[...Array(25)].map((_, i) => (
                            <div 
                              key={i} 
                              className="flex-1 bg-blue-300 rounded-full transition-all hover:bg-blue-400" 
                              style={{ height: `${Math.random() * 24 + 8}px`}}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-mono text-gray-600 font-medium">
                          {formatDuration(post.duration)}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={clsx(
                            "flex items-center gap-2 transition-all",
                            isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                          )}
                        >
                          <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                          <span className="text-sm font-medium">{post._count.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-500 hover:text-[#2A5CAA] transition-colors">
                          <MessageCircle size={22} />
                          <span className="text-sm font-medium">{post._count.comments}</span>
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Share2 size={22} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
