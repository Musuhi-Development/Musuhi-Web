"use client";

import { useState } from "react";
import { Plus, Gift, Send, Users, ChevronRight, Mail } from "lucide-react";
import { clsx } from "clsx";

export default function GiftPage() {
  const [activeTab, setActiveTab] = useState<"new" | "received" | "sent" | "yosegaki">("new");

  // Mock Menu Items
  const menuItems = [
    { id: "new", label: "新規作成", icon: Plus },
    { id: "received", label: "受信箱", icon: Gift },
    { id: "sent", label: "送信済", icon: Send },
    { id: "yosegaki", label: "寄せ音声", icon: Users },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white z-30 p-4 shadow-sm border-b">
        <h1 className="text-xl font-bold text-gray-800">ボイスギフト</h1>
      </header>

      {/* Navigation Tabs (Simulated) */}
      <div className="flex justify-around bg-white border-b sticky top-[60px] z-20">
        {menuItems.map((item) => {
            const Icon = item.icon;
            return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={clsx(
                        "flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 border-b-2 transition-colors",
                        activeTab === item.id 
                            ? "border-orange-500 text-orange-600" 
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    <Icon size={20} />
                    {item.label}
                </button>
            )
        })}
      </div>

      <div className="p-4">
        {activeTab === "new" && (
            <div className="space-y-6">
                 {/* Create Gift CTA */}
                 <div className="bg-orange-50 rounded-xl p-6 text-center border border-orange-100">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-500">
                        <Gift size={32} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">誰に声を贈りますか？</h2>
                    <p className="text-sm text-gray-600 mb-6">大切な人へ、声のメッセージを届けましょう。</p>
                    <button className="w-full bg-orange-500 text-white font-bold py-3 rounded-full hover:bg-orange-600 shadow-md transition-colors">
                        メッセージを作成する
                    </button>
                 </div>

                 {/* Recent Friends */}
                 <div>
                    <h3 className="font-bold text-gray-700 mb-3 text-sm">最近やり取りした人</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <span className="text-xs text-center text-gray-600 truncate w-full">User {i}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        )}

        {activeTab === "yosegaki" && (
            <div className="space-y-4">
                 <button 
                    onClick={() => window.location.href = '/gift/yosegaki/new'}
                    className="w-full flex items-center justify-between bg-white border border-dashed border-orange-300 p-4 rounded-xl text-orange-500 font-bold hover:bg-orange-50 transition-colors"
                 >
                    <span className="flex items-center gap-2"><Plus size={20}/> 新しい寄せ書きを作る</span>
                    <ChevronRight size={20} />
                 </button>

                 <div className="space-y-3">
                    <h3 className="font-bold text-gray-700 text-sm">進行中のプロジェクト</h3>
                    {/* Dummy Project Card */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800">田中さんの誕生日</h4>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">募集中</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">締切: 2024年2月15日</p>
                        
                        {/* 送信者の寄せ音声を表示（トップのみ） */}
                        <div className="mb-3 bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">最新の寄せ音声</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-200"></div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-800">山田さん</p>
                                    <p className="text-[10px] text-gray-500">おめでとうメッセージ • 02:15</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 border border-white"></div>
                                <div className="w-6 h-6 rounded-full bg-gray-300 border border-white"></div>
                                <div className="w-6 h-6 rounded-full bg-gray-400 border border-white"></div>
                            </div>
                            <span className="text-xs text-gray-500">3人が参加中</span>
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {(activeTab === "sent" || activeTab === "received") && (
            <div className="text-center py-10 text-gray-400">
                <Mail size={48} className="mx-auto mb-2 opacity-50" />
                <p>履歴はありません</p>
            </div>
        )}
      </div>
    </div>
  );
}
