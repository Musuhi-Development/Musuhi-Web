"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, Upload, Mic } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import DateTimePickerInput from "@/components/DateTimePickerInput";

export default function NewYosegakiPage() {
  const router = useRouter();
  const { user } = useUser();

  // 基本情報
  const [recipientName, setRecipientName] = useState("");
  const [mainMessage, setMainMessage] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerComment, setOrganizerComment] = useState("");

  // 日時
  const [deadline, setDeadline] = useState("");
  const [deliverAt, setDeliverAt] = useState("");

  // 企画者ポラロイド
  const [organizerImageUrl, setOrganizerImageUrl] = useState("");
  const [organizerAudioTitle, setOrganizerAudioTitle] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    recipientName.trim() &&
    mainMessage.trim() &&
    organizerName.trim() &&
    organizerComment.trim() &&
    deadline &&
    deliverAt;

  async function handleCreate() {
    if (!isValid || creating) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/yosegaki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipientName.trim(),
          description: mainMessage.trim(),
          recipientName: recipientName.trim(),
          organizerName: organizerName.trim(),
          organizerComment: organizerComment.trim(),
          organizerImageUrl: organizerImageUrl || null,
          organizerAudioTitle: organizerAudioTitle || null,
          deadline: new Date(deadline).toISOString(),
          deliverAt: new Date(deliverAt).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "作成に失敗しました");
      }
      const data = await res.json();
      // ドラフト画面をスキップして即座にcollecting状態へ移行
      await fetch(`/api/yosegaki/${data.yosegaki.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "collecting" }),
      });
      router.push(`/gift/yosegaki/${data.yosegaki.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col pb-12">
      <header className="px-4 py-3 flex justify-between items-center border-b bg-white sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">
          キャンセル
        </button>
        <span className="font-bold text-gray-800">声の寄せ書きを作る</span>
        <button
          onClick={handleCreate}
          disabled={!isValid || creating}
          className="text-[#2A5CAA] font-bold text-sm disabled:text-gray-300"
        >
          {creating ? "作成中…" : "作成"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ヘッダービジュアル */}
        <div className="flex flex-col items-center py-3 gap-2">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-rose-300 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="text-white" size={40} />
          </div>
          <p className="text-xs text-gray-500 text-center">
            みんなの声を集めて、<br />大切な人へ届けよう
          </p>
        </div>

        {/* 宛名 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            宛名（お届け先のお名前）<span className="text-red-500"> ※</span>
          </label>
          <input
            type="text"
            placeholder="例: 田中さん"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full text-base border-b-2 border-gray-200 py-2 focus:outline-none focus:border-[#2A5CAA] bg-transparent placeholder:text-gray-300"
          />
        </div>

        {/* メインメッセージ（便箋） */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            メインメッセージ（便箋に表示）<span className="text-red-500"> ※</span>
          </label>
          <div
            className="relative rounded-xl bg-[#FBF8F0] border border-[#e7ddd0] px-4 py-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 27px, rgba(120,95,55,0.10) 27px, rgba(120,95,55,0.10) 28px)",
            }}
          >
            <textarea
              placeholder="みんなへ呼びかける言葉を書いてください"
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              rows={4}
              className="w-full bg-transparent focus:outline-none text-sm text-gray-700 placeholder:text-gray-300 resize-none leading-7"
            />
          </div>
        </div>

        {/* 募集期限 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1">
            <Clock size={12} />
            募集期限<span className="text-red-500"> ※</span>
          </label>
          <DateTimePickerInput value={deadline} onChange={setDeadline} />
        </div>

        {/* お届け日 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1">
            <Calendar size={12} />
            お届け日時<span className="text-red-500"> ※</span>
          </label>
          <DateTimePickerInput value={deliverAt} onChange={setDeliverAt} />
        </div>

        {/* 参加者への依頼コメント */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            参加者への依頼コメント<span className="text-red-500"> ※</span>
          </label>
          <textarea
            placeholder="例: ○○さんの誕生日に贈る声の寄せ書きを作っています。ぜひ一言メッセージをお願いします！"
            value={organizerComment}
            onChange={(e) => setOrganizerComment(e.target.value)}
            rows={3}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] placeholder:text-gray-400 resize-none text-sm"
          />
        </div>

        {/* 企画者名 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            企画者名<span className="text-red-500"> ※</span>
          </label>
          <input
            type="text"
            placeholder="例: 山田（幹事）"
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] placeholder:text-gray-400 text-sm"
          />
          <p className="text-[10px] text-gray-400 mt-1">完成後、宛先の方に表示される企画者名です</p>
        </div>

        {/* 企画者ポラロイド（任意） */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500">あなたのポラロイド（任意）</p>
          <p className="text-[11px] text-gray-400">企画者として先頭に表示されます。あとからでも追加できます。</p>

          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">ポラロイドタイトル</label>
            <input
              type="text"
              placeholder="例: 「いつもありがとう」"
              value={organizerAudioTitle}
              onChange={(e) => setOrganizerAudioTitle(e.target.value)}
              maxLength={20}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:border-[#2A5CAA] text-sm placeholder:text-gray-300"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 p-4 rounded-xl">
          <p>💡 作成後、企画者ポラロイド（画像・音声）の追加や共有リンクの発行ができます。</p>
        </div>
      </div>
    </div>
  );
}
