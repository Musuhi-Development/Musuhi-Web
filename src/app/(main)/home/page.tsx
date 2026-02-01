"use client";

import { useState } from "react";
import { Search, List, Calendar, MapPin, Lock, Globe, Users } from "lucide-react";
import { clsx } from "clsx";

// Dummy Data
const dummyJournals = [
  {
    id: 1,
    title: "今日の振り返り",
    date: "2024-02-01 20:30",
    emotions: ["感謝", "楽しい"],
    duration: "03:15",
    thumbnail: null,
    location: "東京都渋谷区",
    visibility: "private", // private, friends, public
  },
  {
    id: 2,
    title: "ランチが美味しかった",
    date: "2024-02-01 12:15",
    emotions: ["幸せ", "ワクワク"],
    duration: "01:45",
    thumbnail: "bg-orange-100",
    location: "東京都港区",
    visibility: "friends",
  },
  {
    id: 3,
    title: "仕事でミスしてしまった...",
    date: "2024-01-31 18:00",
    emotions: ["悲しい", "励まし"],
    duration: "05:10",
    thumbnail: null,
    location: null,
    visibility: "private",
  },
];

const emotionTags = ["全て", "嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "励まし", "疲れた", "悲しい", "イライラ"];

export default function HomePage() {
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [selectedTag, setSelectedTag] = useState("全て");

  return (
    <div className="pb-24">
      {/* Header / Search / Sort */}
      <header className="sticky top-0 bg-white z-30 p-4 shadow-sm space-y-3">
        <h1 className="text-xl font-bold text-gray-800">ボイスアルバム</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="キーワード検索..."
            className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[70%]">
                {emotionTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={clsx(
                            "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
                            selectedTag === tag 
                                ? "bg-orange-500 text-white" 
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode("timeline")}
                    className={clsx("p-1.5 rounded-md", viewMode === "timeline" ? "bg-white shadow-sm" : "text-gray-400")}
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode("calendar")}
                    className={clsx("p-1.5 rounded-md", viewMode === "calendar" ? "bg-white shadow-sm" : "text-gray-400")}
                >
                    <Calendar size={18} />
                </button>
            </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Analysis Dashboard Summary */}
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 shadow-sm border border-orange-100">
            <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    今月の分析
                </h2>
                <span className="text-xs text-orange-600 font-medium">詳細を見る &gt;</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs text-gray-500">ジャーナル数</p>
                    <p className="text-xl font-bold text-gray-800">12<span className="text-xs font-normal ml-1">件</span></p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs text-gray-500">主な感情</p>
                    <p className="text-xl font-bold text-orange-500">感謝</p>
                </div>
            </div>
            <div className="mt-3 bg-white/60 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">AIコメント</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                    今月は感謝の言葉が多く記録されています。周りの人との繋がりを大切にしている様子が伺えます。
                </p>
            </div>
        </section>

        {/* Timeline */}
        <div className="space-y-4">
            {dummyJournals.map((journal) => (
                <article key={journal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex p-3 gap-3">
                         {/* Thumbnail Placeholder */}
                        <div className={clsx(
                            "w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400",
                            journal.thumbnail ? journal.thumbnail : "bg-gray-100"
                        )}>
                           {!journal.thumbnail && <span className="text-[10px]">No Image</span>}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 truncate pr-2">{journal.title}</h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{journal.date.split(" ")[0]}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {journal.emotions.map(e => (
                                        <span key={e} className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-md">
                                            #{e}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                <span className="flex items-center gap-1">
                                    ⏱ {journal.duration}
                                </span>
                                <div className="flex items-center gap-3">
                                    {journal.location && <MapPin size={12} />}
                                    {journal.visibility === "private" && <Lock size={12} />}
                                    {journal.visibility === "friends" && <Users size={12} />}
                                    {journal.visibility === "public" && <Globe size={12} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            ))}
        </div>
      </div>
    </div>
  );
}
