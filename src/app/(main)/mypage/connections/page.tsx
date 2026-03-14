"use client";

import { useState, useMemo } from "react";
import { Search, Mail, Calendar, MessageSquare, ChevronDown, User, Check, X as XIcon } from "lucide-react";
import { clsx } from "clsx";
import PageHeader from "@/components/shared/PageHeader";
import { useConnections, ConnectionWithUsers } from "@/hooks/useConnections";
import { useUser } from "@/hooks/useUser";
import UserSearch from "@/components/connections/UserSearch";

type FilterTab = "all" | "email" | "sns" | "birthday";

export default function ConnectionsPage() {
  const { user } = useUser();
  const { connections, loading, error, updateConnectionStatus, deleteConnection } = useConnections();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { pendingRequests, acceptedConnections } = useMemo(() => {
    const pending: ConnectionWithUsers[] = [];
    const accepted: ConnectionWithUsers[] = [];
    connections.forEach(conn => {
      if (conn.status === 'pending') {
        pending.push(conn);
      } else if (conn.status === 'accepted') {
        accepted.push(conn);
      }
    });
    return { pendingRequests: pending, acceptedConnections: accepted };
  }, [connections]);

  const processedConnections = useMemo(() => {
    if (!user) return [];
    return acceptedConnections.map(conn => {
      const otherUser = conn.initiatorId === user.id ? conn.receiver : conn.initiator;
      return {
        id: conn.id,
        name: otherUser.displayName || otherUser.name || "名無しさん",
        username: otherUser.name || "",
        avatarUrl: otherUser.avatarUrl,
        email: `user_${otherUser.id}@example.com`,
        sns: "",
        birthday: null,
        anniversaries: [],
        memo: "",
      };
    });
  }, [acceptedConnections, user]);

  const filteredConnections = useMemo(() => {
    return processedConnections.filter(conn => {
      if (searchQuery && !conn.name.includes(searchQuery) && !conn.username.includes(searchQuery)) {
        return false;
      }
      if (activeTab === "email" && !conn.email) return false;
      if (activeTab === "sns" && !conn.sns) return false;
      if (activeTab === "birthday" && !conn.birthday) return false;
      return true;
    });
  }, [processedConnections, searchQuery, activeTab]);

  if (error) {
    return (
      <div className="pb-24 min-h-screen bg-gray-50">
        <PageHeader title="つながりリスト" showBackButton={true} />
        <div className="p-4 text-center text-red-500">エラー: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <PageHeader title="つながりリスト" showBackButton={true} />
      
      <div className="p-4">
        <UserSearch />

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="my-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">承認待ちのリクエスト</h2>
            <div className="space-y-2">
              {pendingRequests.map(conn => {
                const requestUser = conn.initiatorId === user?.id ? conn.receiver : conn.initiator;
                const isReceived = conn.receiverId === user?.id;

                return (
                  <div key={conn.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full">
                        {requestUser.avatarUrl && <img src={requestUser.avatarUrl} alt={requestUser.displayName || ''} className="w-full h-full rounded-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{requestUser.displayName || requestUser.name}</p>
                        <p className="text-xs text-gray-500">{isReceived ? "あなた宛のリクエスト" : "あなたが送信したリクエスト"}</p>
                      </div>
                    </div>
                    {isReceived && (
                      <div className="flex gap-2">
                        <button onClick={() => updateConnectionStatus(conn.id, 'accepted')} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200">
                          <Check size={18} />
                        </button>
                        <button onClick={() => updateConnectionStatus(conn.id, 'blocked')} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                          <XIcon size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-3">あなたのつながり</h2>
        {/* Search & Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Search */}
          <div className="px-4 pt-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="つながり内で検索..."
                className="w-full bg-gray-50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto border-t border-gray-100 pt-3">
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
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
           <div className="text-center py-10">読み込み中...</div>
        ) : filteredConnections.length === 0 ? (
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex-shrink-0">
                  {conn.avatarUrl && <img src={conn.avatarUrl} alt={conn.name} className="w-full h-full rounded-full object-cover" />}
                </div>
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
                  {/* Details... */}
                  <button onClick={() => deleteConnection(conn.id)} className="w-full text-left text-xs text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50">
                    つながりを解除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
