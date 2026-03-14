"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Play, Loader2, Check } from "lucide-react";

type Recording = {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  createdAt: string;
};

export default function NewGiftPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchRecordings();
  }, []);

  async function fetchRecordings() {
    try {
      const res = await fetch("/api/recordings");
      if (res.ok) {
        const data = await res.json();
        setRecordings(data.recordings);
      }
    } catch (error) {
      console.error("Failed to fetch recordings:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSend = async () => {
    if (!recipientEmail || !selectedRecording) {
      alert("宛先と録音を選択してください");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedRecording.title,
          message: message.trim() || null,
          recordingId: selectedRecording.id,
          recipientEmail,
          isPublic: false,
        }),
      });

      if (!res.ok) {
        throw new Error("ギフトの送信に失敗しました");
      }

      router.push("/gift");
    } catch (error) {
      console.error("Send gift error:", error);
      alert(error instanceof Error ? error.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="pb-24 min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={() => router.back()} className="text-gray-500" disabled={sending}>
          キャンセル
        </button>
        <span className="font-bold">ボイスギフト作成</span>
        <button 
          onClick={handleSend}
          className="text-orange-500 font-bold disabled:text-gray-300 flex items-center gap-1"
          disabled={!recipientEmail || !selectedRecording || sending}
        >
          {sending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              送信中...
            </>
          ) : (
            "送信"
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 宛先 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            宛先（名前） <span className="text-red-500">※</span>
          </label>
          <input 
            type="text"
            placeholder="受取人の名前"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={sending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            宛先（メールアドレス） <span className="text-red-500">※</span>
          </label>
          <input 
            type="email"
            placeholder="recipient@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={sending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400"
          />
        </div>

        {/* 録音選択 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            録音を選択 <span className="text-red-500">※</span>
          </label>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">録音がありません</p>
              <button
                onClick={() => router.push("/record")}
                className="text-sm text-orange-500 font-medium"
              >
                録音ページへ
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map((recording) => (
                <button
                  key={recording.id}
                  onClick={() => setSelectedRecording(recording)}
                  disabled={sending}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedRecording?.id === recording.id
                      ? "bg-orange-50 border-orange-400"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {selectedRecording?.id === recording.id ? (
                        <Check size={20} className="text-orange-600" />
                      ) : (
                        <Play size={18} className="text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{recording.title}</p>
                      <p className="text-xs text-gray-500">{formatDuration(recording.duration)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 相手へのメッセージ */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">メッセージ（任意）</label>
          <textarea 
            placeholder="相手へのメッセージを入力..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={sending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
