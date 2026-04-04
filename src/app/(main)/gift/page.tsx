"use client";

import { useState } from "react";
import { Plus, Gift, Send, Users, Mail, Calendar, User } from "lucide-react";
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
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
              const recipient = gift.recipients?.find(
                (r: any) => r.recipientId === user?.id || (user?.email && r.recipientEmail === user.email)
              );
              const contributorCount = new Set(
                (gift.recordings || []).map((recording: any) => recording.contributorId)
              ).size;
              const ownerRecording =
                gift.recordings?.find((recording: any) => recording.contributorId === gift.ownerId)?.recording ||
                gift.recordings?.[0]?.recording;
              const imageUrl = Array.isArray(ownerRecording?.images) ? ownerRecording.images[0] : undefined;
              const animalIcon =
                ownerRecording?.emotions && ownerRecording.emotions.length > 0
                  ? emotionToAnimal[ownerRecording.emotions[0]] || "🎵"
                  : "🎵";
              const participantLabel = contributorCount <= 1 ? "1人" : `${contributorCount}人`;
              const participantIcon = contributorCount <= 1 ? <User size={12} /> : <Users size={12} />;
              const contributorUsers = (gift.recordings || []).map((recording: any) => recording.contributor);
              const uniqueContributors = Array.from(
                new Map(contributorUsers.map((contributor: any) => [contributor.id, contributor])).values()
              );
              const participantUsers = gift.owner
                ? [
                    gift.owner,
                    ...uniqueContributors.filter((contributor: any) => contributor.id !== gift.owner.id),
                  ]
                : uniqueContributors;

              return (
                <Link key={gift.id} href={`/gift/${gift.id}`} className="block">
                  <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={gift.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">{animalIcon}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800 truncate">{gift.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(gift.createdAt)} ・ {gift.recordings?.length || 0}件の音声
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                            {participantIcon}
                            参加 {participantLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center -space-x-2">
                        {participantUsers.slice(0, 3).map((participant: any) => {
                          const displayName = participant.displayName || participant.name || "U";
                          return (
                            <div
                              key={participant.id}
                              className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-sm font-bold overflow-hidden"
                            >
                              {participant.avatarUrl ? (
                                <img src={participant.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                              ) : (
                                displayName[0].toUpperCase()
                              )}
                            </div>
                          );
                        })}
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
