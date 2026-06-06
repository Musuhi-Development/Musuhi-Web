"use client";

import { useState } from "react";
import { Plus, Send, Users, Mail, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useVoiceGifts, VoiceGiftFilter } from "@/hooks/useVoiceGifts";
import { MizuhikiBow } from "@/components/shared/MizuhikiBow";
import { Postmark } from "@/components/shared/Postmark";

const filters: Array<{ id: VoiceGiftFilter; label: string; icon: any }> = [
  { id: "received", label: "届いた", icon: Mail },
  { id: "sent", label: "贈った", icon: Send },
  { id: "draft", label: "下書き", icon: Users },
  { id: "scheduled", label: "未来送信", icon: Calendar },
];

const emotionToAnimal: { [key: string]: string } = {
  "嬉しい": "/animal/dog.png",
  "感謝": "/animal/rabbit.png",
  "楽しい": "/animal/horse.png",
  "幸せ": "/animal/cat.png",
  "ワクワク": "/animal/lion.png",
  "応援": "/animal/tiger.png",
  "疲れた": "/animal/monkey.png",
  "悲しい": "/animal/turtle.png",
  "イライラ": "/animal/bear.png",
};

export default function GiftPage() {
  const [activeFilter, setActiveFilter] = useState<VoiceGiftFilter>("received");
  const { user } = useUser();
  const { voiceGifts, loading, error, refresh } = useVoiceGifts(activeFilter);
  const router = useRouter();

  function pad(n: number) {
    return String(n).padStart(2, "0");
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // 予約送信日時: YYYY/MM/DD/HH:MM お贈り予定
  function formatScheduled(dateString: string) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${pad(date.getHours())}:${pad(date.getMinutes())} お贈り予定`;
  }

  // 寄せ音声版（複数人で作成）の判定
  function getDistinctContributors(gift: any) {
    const contributors = (gift.recordings || [])
      .map((recording: any) => recording.contributor)
      .filter(Boolean);
    return Array.from(new Map(contributors.map((item: any) => [item.id, item])).values());
  }

  function isCollabGift(gift: any) {
    const distinctContributors = getDistinctContributors(gift).length;
    const participantCount = (gift.participants || []).length;
    return distinctContributors > 1 || participantCount > 1;
  }

  function getParticipantUsers(gift: any) {
    const relationUsers = (gift.participants || [])
      .map((participant: any) => participant.user)
      .filter(Boolean);
    const recordingUsers = (gift.recordings || [])
      .map((recording: any) => recording.contributor)
      .filter(Boolean);

    const merged = [gift.owner, ...relationUsers, ...recordingUsers].filter(Boolean);
    return Array.from(new Map(merged.map((item: any) => [item.id, item])).values());
  }

  // タイトル = 添付された音声ジャーナル（録音）のタイトル（代表録音）
  function getGiftDisplayTitle(gift: any): string {
    const first = (gift.recordings || [])[0];
    const title = first?.recording?.title;
    return title && String(title).trim() ? title : "無題";
  }

  function getSenderName(gift: any): string {
    return gift.owner?.displayName || gift.owner?.name || "不明";
  }

  // 宛名 = VoiceGift.title に保存している
  function getRecipientName(gift: any): string {
    return gift.title || "";
  }

  function getFirstEmotions(gift: any): string[] {
    const first = (gift.recordings || [])[0];
    const emotions = first?.recording?.emotions;
    return Array.isArray(emotions) ? emotions.slice(0, 3) : [];
  }

  function getThumb(gift: any): { imageUrl?: string; animalImageSrc?: string | null } | null {
    const first = (gift.recordings || [])[0];
    const recording = first?.recording;
    if (!recording) return null;
    const imageUrl = Array.isArray(recording.images) ? recording.images[0] : undefined;
    const animalImageSrc =
      recording.emotions && recording.emotions.length > 0
        ? (emotionToAnimal[recording.emotions[0]] ?? null)
        : null;
    return { imageUrl, animalImageSrc };
  }

  // 寄せ音声版のみ表示する参加者アイコン＋音声件数
  function renderCollabMeta(gift: any) {
    if (!isCollabGift(gift)) return null;
    const participantUsers = getParticipantUsers(gift);
    const visibleParticipants = participantUsers.slice(0, 4);
    const hiddenParticipantCount = Math.max(participantUsers.length - visibleParticipants.length, 0);

    return (
      <div className="flex items-center gap-1 pt-1">
        {visibleParticipants.map((participant: any) => {
          const displayName = participant.displayName || participant.name || "U";
          return (
            <div
              key={participant.id}
              title={displayName}
              className="w-6 h-6 rounded-full border border-white bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shadow-sm"
            >
              {participant.avatarUrl ? (
                <img src={participant.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName[0].toUpperCase()
              )}
            </div>
          );
        })}
        {hiddenParticipantCount > 0 && (
          <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center">
            +{hiddenParticipantCount}
          </div>
        )}
        <span className="text-[10px] text-gray-400 ml-1">{gift.recordings?.length || 0}件の音声</span>
      </div>
    );
  }

  function renderThumb(gift: any) {
    const thumb = getThumb(gift);
    return (
      <div className="relative w-16 h-16 flex-shrink-0">
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center overflow-hidden">
          {thumb?.imageUrl ? (
            <img src={thumb.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : thumb?.animalImageSrc ? (
            <img src={thumb.animalImageSrc} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl">🎵</span>
          )}
        </div>
      </div>
    );
  }

  function renderEmotionTags(gift: any) {
    const emotions = getFirstEmotions(gift);
    if (emotions.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {emotions.map((emotion) => (
          <span key={emotion} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-[#2A5CAA] rounded-md">
            #{emotion}
          </span>
        ))}
      </div>
    );
  }

  // 「届いた」タブ: 開封体験重視の便箋風カード
  function renderReceivedCard(gift: any) {
    return (
      <Link key={gift.id} href={`/gift/${gift.id}`} className="block">
        <div
          className="relative rounded-2xl border border-[#e7ddd0] bg-[#FAF7F2] shadow-sm hover:shadow-md transition-all p-4"
          style={{
            backgroundImage:
              "radial-gradient(rgba(120,95,55,0.05) 0.5px, transparent 0.5px), radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.5px)",
            backgroundSize: "5px 5px",
            backgroundPosition: "0 0, 2.5px 2.5px",
          }}
        >
          {/* 郵便消印風の装飾アクセント（右上） */}
          <Postmark className="pointer-events-none absolute top-2 right-2 w-12 h-12 rotate-[-8deg] opacity-50" />

          <div className="pr-12">
            <h4 className="text-base font-bold text-gray-800 truncate">{getGiftDisplayTitle(gift)}</h4>
            <p className="text-xs text-gray-500 mt-1">{getSenderName(gift)}より</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(gift.sendAt || gift.createdAt)}</p>
            {renderCollabMeta(gift)}
          </div>

          {/* 便箋らしい薄い横罫線 ＋ 右下に水引（結びマーク） */}
          <div className="mt-4 border-t border-[#e7ddd0] pt-2 flex justify-end">
            <MizuhikiBow className="w-20 h-6 opacity-80" />
          </div>
        </div>
      </Link>
    );
  }

  // 「贈った / 下書き / 未来送信」タブの標準カード
  function renderStandardCard(gift: any) {
    return (
      <Link key={gift.id} href={`/gift/${gift.id}`} className="block">
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4">
          <div className="flex items-start gap-4">
            {renderThumb(gift)}

            <div className="flex-1 min-w-0 space-y-1">
              {/* 1行目: タイトル（=録音タイトル、太字・1行固定・サイズ固定） */}
              <h4 className="text-base font-bold text-gray-800 truncate">{getGiftDisplayTitle(gift)}</h4>

              {/* 2行目: メッセージ冒頭 */}
              {gift.message && <p className="text-xs text-gray-600 truncate">{gift.message}</p>}

              {/* 3行目: 感情タグ */}
              {renderEmotionTags(gift)}

              {/* 4行目: 宛名 + へ */}
              <p className="text-xs text-[#2A5CAA] font-medium truncate">{getRecipientName(gift)}へ</p>

              {/* 5行目: 日時（sent=送信日時 / scheduled=お贈り予定 / draft=なし） */}
              {activeFilter === "scheduled" && gift.sendAt && (
                <p className="text-[11px] text-amber-600">{formatScheduled(gift.sendAt)}</p>
              )}
              {activeFilter === "sent" && (
                <p className="text-[11px] text-gray-400">{formatDateTime(gift.sendAt || gift.createdAt)}</p>
              )}

              {renderCollabMeta(gift)}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#2A5CAA]">Voice Gift</h1>
          </div>
          <button
            onClick={() => router.push("/mypage")}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold overflow-hidden hover:bg-gray-300 transition-colors"
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

      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Link href="/gift/new">
            <button className="bg-[#2A5CAA] text-white font-bold px-4 py-2 rounded-full shadow-md hover:bg-[#1F4580] transition-all flex items-center gap-2">
              <Plus size={16} />
              贈る
            </button>
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={clsx(
                  "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors font-medium flex items-center gap-2",
                  activeFilter === filter.id
                    ? "bg-[#2A5CAA] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-6 py-2 bg-[#2A5CAA] text-white rounded-full hover:bg-[#1F4580] transition-colors shadow-md"
            >
              再試行
            </button>
          </div>
        ) : voiceGifts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-md">
            <Mail size={48} className="mx-auto mb-3 opacity-40 text-gray-400" />
            <p className="text-gray-500">ボイスギフトはまだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {voiceGifts.map((gift) =>
              activeFilter === "received" ? renderReceivedCard(gift) : renderStandardCard(gift)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
