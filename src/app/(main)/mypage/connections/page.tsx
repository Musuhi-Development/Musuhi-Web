"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Mail, Calendar, MessageSquare, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import PageHeader from "@/components/shared/PageHeader";

type FilterTab = "all" | "email" | "sns" | "birthday";

const dummyConnections = [
  {
    id: 1,
    name: "山田太郎",
    username: "@yamada_t",
    email: "yamada@example.com",
    sns: "Twitter: @yamada_tw",
    birthday: "1990-05-15",
    anniversaries: ["結婚記念日: 2015-06-20"],
    memo: "大学時代の友人。ギターが得意。",
  },
  {
    id: 2,
    name: "佐藤花子",
    username: "@sato_h",
    email: "sato@example.com",
    sns: "Instagram: @sato_hanako",
    birthday: "1992-08-22",
    anniversaries: [],
    memo: "会社の同僚。企画部所属。",
  },
  {
    id: 3,
    name: "鈴木一郎",
    username: "@suzuki_i",
    email: "",
    sns: "",
    birthday: "1988-12-03",
    anniversaries: ["就職記念日: 2011-04-01"],
    memo: "",
  },
];

export default function ConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConnections = dummyConnections.filter(conn => {
    if (searchQuery && !conn.name.includes(searchQuery) && !conn.username.includes(searchQuery)) {
      return false;
    }
    if (activeTab === "email" && !conn.email) return false;
    if (activeTab === "sns" && !conn.sns) return false;
    if (activeTab === "birthday" && !conn.birthday) return false;
    return true;
  });

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <PageHeader title="つながりリスト" showBackButton={true} />
      
      {/* Search & Filter Section */}
      <div className="bg-white border-b">
        {/* Search */}
        <div className="px-4 pt-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前で検索..."
              className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={clsx(
              "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
              activeTab === "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            全て
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={clsx(
              "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1",
              activeTab === "email" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <Mail size={12} /> メール
          </button>
          <button
            onClick={() => setActiveTab("sns")}
            className={clsx(
              "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1",
              activeTab === "sns" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <MessageSquare size={12} /> SNS
          </button>
          <button
            onClick={() => setActiveTab("birthday")}
            className={clsx(
              "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1",
              activeTab === "birthday" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <Calendar size={12} /> 誕生日
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {filteredConnections.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>該当するつながりがありません</p>
          </div>
        ) : (
          filteredConnections.map((conn) => (
            <div key={conn.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === conn.id ? null : conn.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800">{conn.name}</p>
                  <p className="text-xs text-gray-500">{conn.username}</p>
                </div>
                <ChevronDown 
                  size={20} 
                  className={clsx(
                    "text-gray-400 transition-transform",
                    expandedId === conn.id && "rotate-180"
                  )}
                />
              </button>

              {expandedId === conn.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-gray-50">
                  {/* Email */}
                  {(activeTab === "all" || activeTab === "email") && conn.email && (
                    <div className="flex items-start gap-2">
                      <Mail size={16} className="text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">メールアドレス</p>
                        <p className="text-sm text-gray-800">{conn.email}</p>
                      </div>
                    </div>
                  )}

                  {/* SNS */}
                  {(activeTab === "all" || activeTab === "sns") && conn.sns && (
                    <div className="flex items-start gap-2">
                      <MessageSquare size={16} className="text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">SNSアカウント</p>
                        <p className="text-sm text-gray-800">{conn.sns}</p>
                      </div>
                    </div>
                  )}

                  {/* Birthday & Anniversaries */}
                  {(activeTab === "all" || activeTab === "birthday") && conn.birthday && (
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">誕生日</p>
                        <p className="text-sm text-gray-800">{conn.birthday}</p>
                        {conn.anniversaries.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500">記念日</p>
                            {conn.anniversaries.map((ann, idx) => (
                              <p key={idx} className="text-xs text-gray-700">{ann}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Memo */}
                  {activeTab === "all" && conn.memo && (
                    <div className="flex items-start gap-2">
                      <MessageSquare size={16} className="text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">メモ</p>
                        <p className="text-sm text-gray-800">{conn.memo}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
