"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, Play, Pause, Users, Mail, Calendar, Send, Plus, X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { clsx } from "clsx";

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

const emotionTags = [
  "全て",
  "嬉しい",
  "感謝",
  "楽しい",
  "幸せ",
  "ワクワク",
  "応援",
  "励まし",
  "疲れた",
  "悲しい",
  "イライラ",
];

type Recording = {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  createdAt: string;
  emotions?: string[];
  images?: string[];
};

type UserResult = {
  id: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  matchedBy?: string[];
};

type SendMode = "draft" | "now" | "scheduled";

function NewGiftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTitle = searchParams.get("title") || "";
  const [title, setTitle] = useState(prefillTitle);
  const [message, setMessage] = useState("");
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedTag, setSelectedTag] = useState("全て");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("draft");
  const [sendAt, setSendAt] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [debouncedQuery] = useDebounce(recipientQuery, 400);

  useEffect(() => {
    fetchRecordings();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setRecipientResults([]);
      setInviteEmail("");
      return;
    }

    let isMounted = true;
    setRecipientLoading(true);

    fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!isMounted) return;
        setRecipientResults(data.users || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setRecipientResults([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setRecipientLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const queryIsEmail = useMemo(() => {
    const normalized = recipientQuery.trim().toLowerCase();
    if (!normalized) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  }, [recipientQuery]);

  useEffect(() => {
    if (!recipientQuery) {
      setInviteEmail("");
      return;
    }
    if (recipientResults.length > 0 || recipientLoading) return;
    if (!queryIsEmail) {
      setInviteEmail("");
      return;
    }
    setInviteEmail(recipientQuery.trim().toLowerCase());
  }, [recipientQuery, recipientResults.length, recipientLoading, queryIsEmail]);

  async function fetchRecordings() {
    try {
      const res = await fetch("/api/recordings");
      if (res.ok) {
        const data = await res.json();
        setRecordings(data.recordings || []);
      }
    } catch (error) {
      console.error("Failed to fetch recordings:", error);
    } finally {
      setLoading(false);
    }
  }

  const maxScheduleDate = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }, []);

  const minScheduleDate = useMemo(() => new Date(), []);

  const handleToggleRecording = (recordingId: string) => {
    setSelectedRecordingIds((prev) =>
      prev.includes(recordingId) ? prev.filter((id) => id !== recordingId) : [...prev, recordingId]
    );
  };

  const handleAddRecipientUser = (user: UserResult) => {
    if (selectedUsers.some((u) => u.id === user.id)) return;
    setSelectedUsers((prev) => [...prev, user]);
  };

  const handleRemoveRecipientUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddEmail = () => {
    const normalized = inviteEmail.trim().toLowerCase();
    if (!normalized) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      alert("正しいメールアドレスを入力してください");
      return;
    }
    if (recipientEmails.includes(normalized)) return;
    setRecipientEmails((prev) => [...prev, normalized]);
    setInviteEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setRecipientEmails((prev) => prev.filter((item) => item !== email));
  };

  const togglePlayPause = (recording: Recording, event?: MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!recording.audioUrl) {
      alert("音声ファイルが見つかりません");
      return;
    }

    if (playingId === recording.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (playingId !== recording.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(recording.audioUrl);
      audioRef.current = audio;
      setPlayingId(recording.id);

      audio.onended = () => {
        setIsPlaying(false);
        setPlayingId(null);
      };

      audio.onerror = () => {
        alert("音声の再生に失敗しました");
        setIsPlaying(false);
        setPlayingId(null);
      };

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Playback error:", err);
        alert("音声の再生に失敗しました");
        setIsPlaying(false);
        setPlayingId(null);
      });
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    if (selectedUsers.length === 0 && recipientEmails.length === 0) {
      alert("宛先を1人以上追加してください");
      return;
    }

    if (sendMode === "scheduled") {
      if (!sendAt) {
        alert("送信日時を選択してください");
        return;
      }
      const selectedDate = new Date(sendAt);
      if (selectedDate < minScheduleDate || selectedDate > maxScheduleDate) {
        alert("送信日時は1週間以内で選択してください");
        return;
      }
    }

    setSending(true);

    try {
      const payload: any = {
        title: title.trim(),
        message: message.trim() || null,
        recipientIds: selectedUsers.map((user) => user.id),
        recipientEmails,
        recordingIds: selectedRecordingIds,
        sendNow: sendMode === "now",
      };

      if (sendMode === "scheduled") {
        payload.sendAt = sendAt;
      }

      const res = await fetch("/api/voice-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("ボイスギフトの作成に失敗しました");
      }

      const data = await res.json();
      router.push(`/gift/${data.voiceGift.id}`);
    } catch (error) {
      console.error("Send voice gift error:", error);
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

  const uniqueRecipientResults = useMemo(() => {
    const map = new Map<string, UserResult>();
    recipientResults.forEach((result) => {
      if (!map.has(result.id)) {
        map.set(result.id, result);
      }
    });
    const selectedIds = new Set(selectedUsers.map((user) => user.id));
    return Array.from(map.values()).filter((result) => !selectedIds.has(result.id));
  }, [recipientResults, selectedUsers]);

  const matchLabels: Record<string, string> = {
    displayName: "表示名一致",
    name: "ユーザーID一致",
    email: "メール一致",
    id: "ID一致",
  };

  const filteredRecordings = useMemo(() => {
    if (selectedTag === "全て") return recordings;
    return recordings.filter(
      (recording) => Array.isArray(recording.emotions) && recording.emotions.includes(selectedTag)
    );
  }, [recordings, selectedTag]);

  return (
    <div className="pb-24 min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={() => router.back()} className="text-gray-500" disabled={sending}>
          キャンセル
        </button>
        <span className="font-bold">ボイスギフト作成</span>
        <button
          onClick={handleSend}
          className="text-[#2A5CAA] font-bold disabled:text-gray-300 flex items-center gap-1"
          disabled={sending}
        >
          {sending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              送信中...
            </>
          ) : sendMode === "draft" ? (
            "下書き保存"
          ) : sendMode === "now" ? (
            "送信"
          ) : (
            "予約送信"
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            タイトル <span className="text-red-500">※</span>
          </label>
          <input
            type="text"
            placeholder="例: みんなからのメッセージ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={sending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 block">
            宛先 <span className="text-red-500">※</span>
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-400" />
              <input
                type="text"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                placeholder="ユーザー名 / ID / メールで検索"
                className="flex-1 bg-transparent text-sm focus:outline-none"
                disabled={sending}
              />
            </div>

            {recipientLoading && (
              <div className="text-xs text-gray-400">検索中...</div>
            )}

            {uniqueRecipientResults.length > 0 && (
              <div className="space-y-2">
                {uniqueRecipientResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleAddRecipientUser(result)}
                    className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-[#2A5CAA]/40"
                    disabled={sending}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        {result.avatarUrl && (
                          <img src={result.avatarUrl} alt={result.displayName || ""} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">
                          {result.displayName || result.name || "ユーザー"}
                        </p>
                        <p className="text-xs text-gray-500">@{result.name || ""}</p>
                        {result.matchedBy && result.matchedBy.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.matchedBy.map((key) => (
                              <span key={key} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {matchLabels[key] || "一致"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Plus size={16} className="text-[#2A5CAA]" />
                  </button>
                ))}
              </div>
            )}
            {!recipientLoading && recipientQuery && uniqueRecipientResults.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">該当するユーザーが見つかりませんでした。</p>
                <div className="flex items-center gap-2 mt-2">
                  <Mail size={16} className="text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="メールで招待"
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700"
                    disabled={sending}
                  >
                    招待
                  </button>
                </div>
              </div>
            )}

            {(selectedUsers.length > 0 || recipientEmails.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span key={user.id} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                    {user.displayName || user.name || "ユーザー"}
                    <button onClick={() => handleRemoveRecipientUser(user.id)} type="button">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {recipientEmails.map((email) => (
                  <span key={email} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs">
                    {email}
                    <button onClick={() => handleRemoveEmail(email)} type="button">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            音声を選択（複数選択可）
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
            {emotionTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={clsx(
                  "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors font-medium",
                  selectedTag === tag
                    ? "bg-[#2A5CAA] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
                disabled={sending}
              >
                {tag}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">
                {selectedTag === "全て" ? "録音がありません" : "このタグの録音がありません"}
              </p>
              <button
                onClick={() => router.push("/record")}
                className="text-sm text-[#2A5CAA] font-medium"
              >
                録音ページへ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredRecordings.map((recording) => {
                const selected = selectedRecordingIds.includes(recording.id);
                const animalIcon =
                  recording.emotions && recording.emotions.length > 0
                    ? emotionToAnimal[recording.emotions[0]] || "🎵"
                    : "🎵";

                return (
                  <div
                    key={recording.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggleRecording(recording.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleToggleRecording(recording.id);
                      }
                    }}
                    className={clsx(
                      "w-full text-left bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-3 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2A5CAA]/30",
                      selected ? "border-[#2A5CAA] bg-blue-50" : "border-transparent"
                    )}
                  >
                    <div className="relative w-full aspect-square mb-3">
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                        <span className="text-5xl">{animalIcon}</span>
                      </div>
                      <button
                        onClick={(event) => togglePlayPause(recording, event)}
                        className={clsx(
                          "absolute inset-0 rounded-xl flex items-center justify-center transition-all",
                          selected ? "bg-[#2A5CAA]/20" : "bg-black/30"
                        )}
                        aria-label={playingId === recording.id && isPlaying ? "一時停止" : "再生"}
                      >
                        {playingId === recording.id && isPlaying ? (
                          <Pause className="text-white drop-shadow-lg" size={24} />
                        ) : (
                          <Play className="text-white drop-shadow-lg" size={24} />
                        )}
                      </button>
                      {selected && (
                        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-white/80 text-[#2A5CAA] rounded-full">
                          選択中
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{recording.title}</p>
                    <p className="text-xs text-gray-500">{formatDuration(recording.duration)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            送信タイミング
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "draft", label: "下書き保存" },
              { id: "now", label: "今すぐ送信" },
              { id: "scheduled", label: "予約送信" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSendMode(option.id as SendMode)}
                className={clsx(
                  "py-2 rounded-xl text-xs font-semibold border",
                  sendMode === option.id
                    ? "bg-[#2A5CAA] text-white border-[#2A5CAA]"
                    : "bg-white text-gray-600 border-gray-200"
                )}
                disabled={sending}
              >
                {option.label}
              </button>
            ))}
          </div>
          {sendMode === "scheduled" && (
            <div className="mt-3">
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                送信日時（1週間以内）
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={sendAt}
                  onChange={(e) => setSendAt(e.target.value)}
                  min={minScheduleDate.toISOString().slice(0, 16)}
                  max={maxScheduleDate.toISOString().slice(0, 16)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:border-[#2A5CAA]"
                  disabled={sending}
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 flex items-center gap-2">
          <Send size={14} />
          送信先を追加したあと、録音を選択してボイスギフトを保存してください。
        </div>
      </div>
    </div>
  );
}

export default function NewGiftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NewGiftPageInner />
    </Suspense>
  );
}
