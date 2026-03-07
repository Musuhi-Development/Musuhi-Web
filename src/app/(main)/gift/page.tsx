"use client";

import { useState, useEffect } from "react";
import { Plus, Gift, Send, Users, ChevronRight, Mail } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import Link from "next/link";

type GiftType = {
  id: string;
  title: string;
  message: string | null;
  isOpened: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  recipient: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  recording: {
    id: string;
    title: string;
    duration: number;
  };
};

type YosegakiType = {
  id: string;
  title: string;
  description: string | null;
  recipientName: string;
  dueDate: string | null;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    displayName: string | null;
  };
  contributions: Array<{
    id: string;
    message: string | null;
    createdAt: string;
    contributor: {
      id: string;
      name: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    recording: {
      id: string;
      title: string;
      duration: number;
    };
  }>;
};

export default function GiftPage() {
  const [activeTab, setActiveTab] = useState<"new" | "received" | "sent" | "yosegaki">("new");
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [yosegakiList, setYosegakiList] = useState<YosegakiType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab === "received" || activeTab === "sent") {
      fetchGifts();
    } else if (activeTab === "yosegaki") {
      fetchYosegaki();
    }
  }, [activeTab]);

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

  async function fetchGifts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gifts?type=${activeTab}`);
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("ギフトの取得に失敗しました");
      }
      
      const data = await res.json();
      setGifts(data.gifts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function fetchYosegaki() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/yosegaki?type=created");
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("寄せ音声の取得に失敗しました");
      }
      
      const data = await res.json();
      setYosegakiList(data.yosegakiList || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", { 
      year: "numeric", 
      month: "numeric", 
      day: "numeric" 
    });
  }

  function getStatusBadge(status: string) {
    const badges = {
      collecting: { label: "募集中", color: "bg-green-100 text-green-700" },
      completed: { label: "完了", color: "bg-blue-100 text-blue-700" },
      delivered: { label: "送付済", color: "bg-gray-100 text-gray-700" },
    };
    return badges[status as keyof typeof badges] || badges.collecting;
  }

  // Mock Menu Items
  const menuItems = [
    { id: "new", label: "新規作成", icon: Plus },
    { id: "received", label: "受信箱", icon: Gift },
    { id: "sent", label: "送信済", icon: Send },
    { id: "yosegaki", label: "寄せ音声", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Gift</h1>
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
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-20 px-6 overflow-x-auto">
        <div className="flex gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  "px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap",
                  activeTab === item.id 
                    ? "border-[#2A5CAA] text-[#2A5CAA]" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6">
        {activeTab === "new" && (
          <div className="space-y-6">
            {/* Create Gift CTA */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 text-center shadow-md">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                <Gift size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">誰に声を贈りますか？</h2>
              <p className="text-sm text-gray-600 mb-6">大切な人へ、声のメッセージを届けましょう。</p>
              <Link href="/gift/new">
                <button className="w-full bg-[#2A5CAA] text-white font-bold py-3 rounded-full hover:bg-[#1F4580] shadow-md transition-all hover:shadow-lg">
                  メッセージを作成する
                </button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "yosegaki" && (
          <div className="space-y-4">
            <Link href="/gift/yosegaki/new">
              <button 
                className="w-full flex items-center justify-between bg-white border-2 border-dashed border-blue-300 p-5 rounded-2xl text-[#2A5CAA] font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <Plus size={20}/> 新しい寄せ書きを作る
                </span>
                <ChevronRight size={20} />
              </button>
            </Link>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={fetchYosegaki}
                  className="px-6 py-2 bg-[#2A5CAA] text-white rounded-full hover:bg-[#1F4580] transition-colors shadow-md"
                >
                  再試行
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700 text-sm px-1">進行中のプロジェクト</h3>
                {yosegakiList.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl shadow-md">
                    <Users size={48} className="mx-auto mb-3 opacity-40 text-gray-400" />
                    <p className="text-gray-500">寄せ音声プロジェクトがありません</p>
                  </div>
                ) : (
                  yosegakiList.map((yosegaki) => {
                    const badge = getStatusBadge(yosegaki.status);
                    const latestContribution = yosegaki.contributions[0];
                    
                    return (
                      <Link key={yosegaki.id} href={`/gift/yosegaki/${yosegaki.id}`}>
                        <div className="bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-gray-800 text-lg">{yosegaki.title}</h4>
                            <span className={`${badge.color} text-xs px-3 py-1 rounded-full font-medium`}>
                              {badge.label}
                            </span>
                          </div>
                          {yosegaki.dueDate && (
                            <p className="text-xs text-gray-500 mb-4">
                              締切: {formatDate(yosegaki.dueDate)}
                            </p>
                          )}
                          
                          {latestContribution && (
                            <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
                              <p className="text-xs font-semibold text-gray-700 mb-3">最新の寄せ音声</p>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white font-bold shadow-md">
                                  {(latestContribution.contributor.displayName || latestContribution.contributor.name)[0].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {latestContribution.contributor.displayName || latestContribution.contributor.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {latestContribution.recording.title} • {formatDuration(latestContribution.recording.duration)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            {yosegaki.contributions.length > 0 && (
                              <>
                                <div className="flex -space-x-2">
                                  {yosegaki.contributions.slice(0, 3).map((contrib, idx) => {
                                    const name = contrib.contributor.displayName || contrib.contributor.name;
                                    return (
                                      <div 
                                        key={contrib.id}
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-300 to-blue-300 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md"
                                      >
                                        {name[0].toUpperCase()}
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                  {yosegaki.contributions.length}人が参加中
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {(activeTab === "sent" || activeTab === "received") && (
          loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={fetchGifts}
                className="px-6 py-2 bg-[#2A5CAA] text-white rounded-full hover:bg-[#1F4580] transition-colors shadow-md"
              >
                再試行
              </button>
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-md">
              <Mail size={48} className="mx-auto mb-3 opacity-40 text-gray-400" />
              <p className="text-gray-500">履歴はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gifts.map((gift) => {
                const displayUser = activeTab === "received" ? gift.sender : gift.recipient;
                const displayName = displayUser ? (displayUser.displayName || displayUser.name) : "不明なユーザー";
                
                return (
                  <Link key={gift.id} href={`/gift/${gift.id}`}>
                    <div className="bg-white p-5 rounded-3xl shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white font-bold shadow-md">
                          {displayName[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{displayName}</p>
                          <p className="text-xs text-gray-500">{formatDate(gift.createdAt)}</p>
                        </div>
                        {activeTab === "received" && !gift.isOpened && (
                          <span className="bg-[#2A5CAA] text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                            新着
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-gray-800 mb-2 text-lg">{gift.title}</h4>
                      {gift.message && (
                        <p className="text-sm text-gray-600 mb-3">{gift.message}</p>
                      )}
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 flex items-center gap-3">
                        <Gift size={20} className="text-[#2A5CAA]" />
                        <span className="text-sm text-gray-700 font-medium">
                          {gift.recording.title} • {formatDuration(gift.recording.duration)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
