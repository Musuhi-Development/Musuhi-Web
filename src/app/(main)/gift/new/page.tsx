"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Image as ImageIcon, ChevronDown, Play, Pause } from "lucide-react";

export default function NewGiftPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const handleSend = () => {
    // 送信処理
    router.push("/gift");
  };

  return (
    <div className="pb-24 min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={() => router.back()} className="text-gray-500">キャンセル</button>
        <span className="font-bold">ボイスギフト作成</span>
        <button 
          onClick={handleSend}
          className="text-orange-500 font-bold disabled:text-gray-300"
          disabled={!recipient || !hasRecording}
        >
          送信
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 宛先 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            宛先 <span className="text-red-500">※</span>
          </label>
          <div className="relative">
            <select 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500"
            >
              <option value="">選択してください</option>
              <option value="user1">山田太郎</option>
              <option value="user2">佐藤花子</option>
              <option value="user3">鈴木一郎</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* 音声録音 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            音声メッセージ <span className="text-red-500">※</span>
          </label>
          
          {!hasRecording ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-dashed border-gray-200">
              <button 
                onClick={() => {
                  setIsRecording(!isRecording);
                  if (!isRecording) {
                    // 録音開始後、3秒後に停止してhasRecordingをtrueに（デモ用）
                    setTimeout(() => {
                      setIsRecording(false);
                      setHasRecording(true);
                    }, 3000);
                  }
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all mx-auto ${
                  isRecording ? "bg-gray-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isRecording ? (
                  <Pause className="text-white" size={32} />
                ) : (
                  <Mic className="text-white" size={32} />
                )}
              </button>
              <p className="mt-4 text-sm text-gray-600">
                {isRecording ? "録音中..." : "タップして録音開始"}
              </p>
              <p className="text-xs text-gray-400 mt-1">最大3分まで</p>
            </div>
          ) : (
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                  <Play size={20} className="text-orange-500" />
                </button>
                <div className="flex-1 h-8 bg-white rounded-full flex items-center gap-0.5 px-2">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-1 bg-orange-300 rounded-full" style={{ height: `${Math.random() * 20 + 4}px`}}></div>
                  ))}
                </div>
                <span className="text-xs font-mono text-gray-600">02:15</span>
              </div>
              <button 
                onClick={() => setHasRecording(false)}
                className="text-xs text-red-500 font-medium"
              >
                削除して録り直す
              </button>
            </div>
          )}
        </div>

        {/* 相手へのメッセージ */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            相手へのメッセージ
          </label>
          <textarea 
            placeholder="テキストメッセージを添えることもできます（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* 画像追加 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            画像を追加
          </label>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            <ImageIcon size={18} />
            画像を選択
          </button>
        </div>
      </div>
    </div>
  );
}
