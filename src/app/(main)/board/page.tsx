"use client";

import { Heart, MessageCircle, Share2, Play, Users } from "lucide-react";

const dummyPosts = [
  {
    id: 1,
    user: "Yuki.T",
    time: "2時間前",
    title: "初めてのギター演奏！",
    duration: "02:20",
    likes: 24,
    comments: 5,
    description: "めっちゃ緊張したけど弾いてみました。聞いてください！",
  },
  {
    id: 2,
    user: "Haruto_Design",
    time: "5時間前",
    title: "朝のボイスダイアリー #05",
    duration: "05:00",
    likes: 12,
    comments: 0,
    description: "今日のテーマは「継続」について。",
  },
];

export default function BoardPage() {
  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white z-30 p-4 shadow-sm border-b">
        <h1 className="text-xl font-bold text-gray-800">ボイスボード</h1>
      </header>

      {/* Tabs */}
      <div className="flex p-2 bg-gray-50 gap-2 overflow-x-auto">
          <button className="px-4 py-1.5 bg-black text-white text-sm rounded-full font-medium">おすすめ</button>
          <button className="px-4 py-1.5 text-gray-600 text-sm rounded-full font-medium hover:bg-white">フォロー中</button>
      </div>

      <div className="divide-y divide-gray-100">
        {dummyPosts.map((post) => (
            <article key={post.id} className="p-4 bg-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                        <p className="font-bold text-sm text-gray-900">{post.user}</p>
                        <p className="text-xs text-gray-400">{post.time}</p>
                    </div>
                </div>

                <div className="mb-3">
                    <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-600">{post.description}</p>
                </div>

                {/* Audio Player Card */}
                <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3 mb-4">
                    <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-800">
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                    </button>
                    <div className="flex-1 h-8 flex items-center gap-0.5">
                        {/* Fake Waveform */}
                        {[...Array(20)].map((_, i) => (
                             <div key={i} className="w-1 bg-gray-300 rounded-full" style={{ height: `${Math.random() * 20 + 8}px`}}></div>
                        ))}
                    </div>
                    <span className="text-xs font-mono text-gray-500">{post.duration}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                            <Heart size={20} />
                            <span className="text-xs font-medium">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                            <MessageCircle size={20} />
                            <span className="text-xs font-medium">音声コメント</span>
                        </button>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <Share2 size={20} />
                    </button>
                </div>
            </article>
        ))}
      </div>
    </div>
  );
}
