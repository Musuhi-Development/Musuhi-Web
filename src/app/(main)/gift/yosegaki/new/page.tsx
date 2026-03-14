"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, ChevronDown, X } from "lucide-react";

export default function NewYosegakiPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  // ダミーの友達リスト
  const friends = ["山田太郎", "佐藤花子", "鈴木一郎", "田中美咲", "高橋健太"];

  const toggleFriend = (friend: string) => {
    setSelectedFriends(prev => 
      prev.includes(friend) ? prev.filter(f => f !== friend) : [...prev, friend]
    );
  };

  const handleCreate = () => {
    // 作成処理
    router.push("/gift");
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b bg-white">
        <button onClick={() => router.back()} className="text-gray-500">キャンセル</button>
        <span className="font-bold">新しい寄せ書き</span>
        <button 
          onClick={handleCreate}
          className="text-orange-500 font-bold disabled:text-gray-300"
          disabled={!title || !deadline || selectedFriends.length === 0}
        >
          作成
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* プロジェクトアイコン */}
        <div className="flex flex-col items-center py-4">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-400 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
            <Users className="text-white" size={48} />
          </div>
        </div>

        {/* タイトル */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            プロジェクトタイトル <span className="text-red-500">※</span>
          </label>
          <input 
            type="text" 
            placeholder="例: 田中さんの誕生日" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-medium border-b-2 border-gray-200 py-2 focus:outline-none focus:border-orange-400 placeholder:text-gray-300 bg-transparent"
          />
        </div>

        {/* 締切日 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            締切日 <span className="text-red-500">※</span>
          </label>
          <div className="relative">
            <input 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:border-orange-400"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        {/* 招待する人 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            招待する人 <span className="text-red-500">※</span>
          </label>
          
          {/* 選択済みの友達 */}
          {selectedFriends.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedFriends.map(friend => (
                <div key={friend} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                  {friend}
                  <button onClick={() => toggleFriend(friend)} className="ml-1 hover:bg-orange-200 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 友達選択 */}
          <div className="space-y-2">
            {friends.map(friend => (
              <button
                key={friend}
                onClick={() => toggleFriend(friend)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedFriends.includes(friend)
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <span className="font-medium text-gray-800">{friend}</span>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedFriends.includes(friend)
                    ? "bg-orange-500 border-orange-500"
                    : "border-gray-300"
                }`}>
                  {selectedFriends.includes(friend) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 相手へのメッセージ */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            相手へのメッセージ
          </label>
          <textarea 
            placeholder="招待メッセージを入力してください（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:border-orange-400 placeholder:text-gray-400 resize-none"
          />
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p>💡 招待された人は締切日までに音声メッセージを録音できます。集まった音声は自動的に寄せ書きとしてまとめられます。</p>
        </div>
      </div>
    </div>
  );
}
