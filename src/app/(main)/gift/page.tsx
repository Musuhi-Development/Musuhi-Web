"use client";

import { useState } from "react";
import { Plus, Gift, Send, Users, Mail, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useVoiceGifts, VoiceGiftFilter } from "@/hooks/useVoiceGifts";

const filters: Array<{ id: VoiceGiftFilter; label: string; icon: any }> = [
  { id: "all", label: "All", icon: Gift },
  { id: "received", label: "受信済み", icon: Mail },
  { id: "sent", label: "送信済み", icon: Send },
  { id: "draft", label: "作成中", icon: Users },
  { id: "scheduled", label: "予約送信", icon: Calendar },
];

const emotionToAnimal: { [key: string]: string } = {
  "嬉しい": "🐶",
  "感謝": "🐱",
  "楽しい": "🐰",
  "幸せ": "🐻",
  "ワクワク": "🐨",
  "応援": "🦁",
  "励まし": "🐼",
  "疲れた": "🐨",
  "悲しい": "🐧",
  "イライラ": "🦊",
};

export default function GiftPage() {
  const [activeFilter, setActiveFilter] = useState<VoiceGiftFilter>("all");
  const { user } = useUser();
  const { voiceGifts, loading, error, refresh } = useVoiceGifts(activeFilter);
  const router = useRouter();

  const statusToneClass: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    slate: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
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

  function getRecordingPreviews(gift: any) {
    const previews = (gift.recordings || []).map((item: any) => {
      const recording = item.recording;
      const imageUrl = Array.isArray(recording?.images) ? recording.images[0] : undefined;
      const animalIcon =
        recording?.emotions && recording.emotions.length > 0
          ? emotionToAnimal[recording.emotions[0]] || "🎵"
          : "🎵";

      return {
        imageUrl,
        animalIcon,
      };
    });

    return previews.slice(0, 4);
  }

  function getGiftStatusBadges(gift: any) {
    const isOwnerOrParticipant =
      gift.ownerId === user?.id ||
      (gift.participants || []).some((participant: any) => participant.userId === user?.id);
    const recipient = (gift.recipients || []).find(
      (r: any) => r.recipientId === user?.id || (user?.email && r.recipientEmail === user.email)
    );

    const badges: Array<{ label: string; tone: "blue" | "emerald" | "amber" | "slate" }> = [];

    if (gift.status === "draft") {
      badges.push({ label: "下書き", tone: "slate" });
    } else if (gift.status === "scheduled") {
      badges.push({ label: "予約送信", tone: "amber" });
    } else if (gift.status === "sent") {
      badges.push({ label: recipient && !isOwnerOrParticipant ? "受信済み" : "送信済み", tone: recipient && !isOwnerOrParticipant ? "emerald" : "blue" });
    } else {
      badges.push({ label: "作成中", tone: "slate" });
    }

    if (gift.status === "sent") {
      if (recipient && !isOwnerOrParticipant) {
        badges.push({ label: recipient.status === "opened" ? "既読" : "未読", tone: recipient.status === "opened" ? "emerald" : "slate" });
      } else {
        const totalRecipients = (gift.recipients || []).length;
        const openedRecipients = (gift.recipients || []).filter((item: any) => item.status === "opened").length;
        if (totalRecipients > 0) {
          if (openedRecipients === 0) {
            badges.push({ label: "未読", tone: "slate" });
          } else if (openedRecipients === totalRecipients) {
            badges.push({ label: "全員既読", tone: "emerald" });
          } else {
            badges.push({ label: `一部既読 ${openedRecipients}/${totalRecipients}`, tone: "amber" });
          }
        }
      }
    }

    return badges;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Voice Gift</h1>
          <button
            onClick={() => router.push("/mypage")}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-all overflow-hidden"
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
          <div>
            <h2 className="text-lg font-bold text-gray-800">All Voice Gifts</h2>
            <p className="text-xs text-gray-500">声のギフト一覧</p>
          </div>
          <Link href="/gift/new">
            <button className="bg-[#2A5CAA] text-white font-bold px-4 py-2 rounded-full shadow-md hover:bg-[#1F4580] transition-all flex items-center gap-2">
              <Plus size={16} />
              新規
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
            {voiceGifts.map((gift) => {
              const participantUsers = getParticipantUsers(gift);
              const visibleParticipants = participantUsers.slice(0, 4);
              const hiddenParticipantCount = Math.max(participantUsers.length - visibleParticipants.length, 0);
              const recordingPreviews = getRecordingPreviews(gift);
              const statusBadges = getGiftStatusBadges(gift);
              const gridSlots: Array<{ imageUrl?: string; animalIcon?: string } | null> = [null, null, null, null];

              if (recordingPreviews.length === 2) {
                gridSlots[0] = recordingPreviews[0];
                gridSlots[3] = recordingPreviews[1];
              } else if (recordingPreviews.length === 3) {
                gridSlots[0] = recordingPreviews[0];
                gridSlots[1] = recordingPreviews[1];
                gridSlots[2] = recordingPreviews[2];
              } else if (recordingPreviews.length >= 4) {
                recordingPreviews.slice(0, 4).forEach((preview: any, index: number) => {
                  gridSlots[index] = preview;
                });
              }

              return (
                <Link key={gift.id} href={`/gift/${gift.id}`} className="block">
                  <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        {recordingPreviews.length <= 1 ? (
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center overflow-hidden">
                            {recordingPreviews[0]?.imageUrl ? (
                              <img src={recordingPreviews[0].imageUrl} alt={gift.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl">{recordingPreviews[0]?.animalIcon || "🎵"}</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                            {gridSlots.map((preview, index) => (
                              <div
                                key={`${gift.id}-preview-${index}`}
                                className="w-full h-full rounded-md bg-gray-200 overflow-hidden flex items-center justify-center"
                              >
                                {preview?.imageUrl ? (
                                  <img src={preview.imageUrl} alt={gift.title} className="w-full h-full object-cover" />
                                ) : preview ? (
                                  <span className="text-sm">{preview.animalIcon || "🎵"}</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800 truncate">{gift.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(gift.createdAt)} ・ {gift.recordings?.length || 0}件の音声
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {visibleParticipants.map((participant: any) => {
                            const displayName = participant.displayName || participant.name || "U";
                            return (
                              <div
                                key={participant.id}
                                title={displayName}
                                className="w-7 h-7 rounded-full border border-white bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-[11px] font-bold overflow-hidden shadow-sm"
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
                            <div className="w-7 h-7 rounded-full border border-gray-200 bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center">
                              +{hiddenParticipantCount}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 w-24 flex-shrink-0">
                        {statusBadges.map((badge, index) => (
                          <span
                            key={`${gift.id}-status-${index}`}
                            className={clsx(
                              "px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap",
                              statusToneClass[badge.tone]
                            )}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
