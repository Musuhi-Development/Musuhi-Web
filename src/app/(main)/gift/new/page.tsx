"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, Play, Pause, Users, Mail, Calendar, Send, Plus, X, Link2 } from "lucide-react";
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
  description?: string | null;
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
type GiftCreationStyle = "solo" | "collab";

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function NewGiftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTitle = searchParams.get("title") || "";
  const [title, setTitle] = useState(prefillTitle);
  const [message, setMessage] = useState("");
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedTag, setSelectedTag] = useState("全て");
  const [recordingKeyword, setRecordingKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("draft");
  const [giftStyle, setGiftStyle] = useState<GiftCreationStyle>("solo");
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

  const [friendCandidates, setFriendCandidates] = useState<UserResult[]>([]);
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendKeyword, setFriendKeyword] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<UserResult[]>([]);
  const [issueShareLink, setIssueShareLink] = useState(false);

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
    if (giftStyle !== "collab") return;
    fetchFriendCandidates();
  }, [giftStyle]);

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

  async function fetchFriendCandidates() {
    setFriendLoading(true);
    try {
      const [meRes, connectionsRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch("/api/connections?status=accepted"),
      ]);

      if (!connectionsRes.ok) {
        throw new Error("友達リストの取得に失敗しました");
      }

      const meData = meRes.ok ? await meRes.json() : null;
      const currentUserId = meData?.user?.id || "";
      const connectionsData = await connectionsRes.json();

      const candidates: UserResult[] = [];

      (connectionsData.connections || []).forEach((connection: any) => {
        const initiator = connection.initiator;
        const receiver = connection.receiver;

        if (initiator?.id && initiator.id !== currentUserId) {
          candidates.push({
            id: initiator.id,
            name: initiator.name || null,
            displayName: initiator.displayName || null,
            avatarUrl: initiator.avatarUrl || null,
          });
        }

        if (receiver?.id && receiver.id !== currentUserId) {
          candidates.push({
            id: receiver.id,
            name: receiver.name || null,
            displayName: receiver.displayName || null,
            avatarUrl: receiver.avatarUrl || null,
          });
        }
      });

      const uniqueMap = new Map<string, UserResult>();
      candidates.forEach((candidate) => {
        if (!uniqueMap.has(candidate.id)) {
          uniqueMap.set(candidate.id, candidate);
        }
      });

      setFriendCandidates(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Failed to fetch friend candidates:", error);
      setFriendCandidates([]);
    } finally {
      setFriendLoading(false);
    }
  }

  const minScheduleDate = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now;
  }, []);

  const maxScheduleDate = useMemo(() => {
    const max = new Date(minScheduleDate);
    max.setDate(max.getDate() + 7);
    return max;
  }, [minScheduleDate]);

  const handleToggleRecording = (recordingId: string) => {
    setSelectedRecordingIds((prev) =>
      prev.includes(recordingId) ? prev.filter((id) => id !== recordingId) : [...prev, recordingId]
    );
  };

  const handleAddRecipientUser = (user: UserResult) => {
    if (selectedUsers.some((u) => u.id === user.id)) return;
    setSelectedUsers((prev) => [...prev, user]);
  };

  const handleAddParticipant = (user: UserResult) => {
    if (selectedParticipants.some((participant) => participant.id === user.id)) return;
    setSelectedParticipants((prev) => [...prev, user]);
  };

  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants((prev) => prev.filter((participant) => participant.id !== userId));
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

    const isCollab = giftStyle === "collab";

    if (isCollab && selectedParticipants.length === 0 && !issueShareLink) {
      alert("共同作成では、共同メンバーを追加するかリンク発行を有効にしてください");
      return;
    }

    if (!isCollab && sendMode === "scheduled") {
      if (!sendAt) {
        alert("送信日時を選択してください");
        return;
      }
      const selectedDate = new Date(sendAt);
      if (selectedDate < minScheduleDate || selectedDate > maxScheduleDate) {
        alert("送信日時は1週間以内で選択してください");
        return;
      }
      if (selectedDate.getMinutes() !== 0) {
        alert("送信予約は1時間単位で設定してください");
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
        participantIds: isCollab ? selectedParticipants.map((participant) => participant.id) : [],
        recordingIds: selectedRecordingIds,
        sendNow: !isCollab && sendMode === "now",
      };

      if (!isCollab && sendMode === "scheduled") {
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

      if (isCollab) {
        const shareToken = data?.voiceGift?.shareToken;
        const shareLink =
          shareToken && typeof window !== "undefined"
            ? `${window.location.origin}/gift/share/${shareToken}`
            : "";

        if (issueShareLink && shareLink) {
          try {
            await navigator.clipboard.writeText(`一緒にボイスギフトを作りませんか？\n${shareLink}`);
            alert("募集を開始しました。共有リンクをコピーしました。ドラフト画面で最終送信してください。");
          } catch {
            alert(`募集を開始しました。共有リンク: ${shareLink}`);
          }
        } else {
          alert("募集を開始しました。ドラフト画面でメンバーの音声を集めてから送信してください。");
        }
      }

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

  const filteredFriendCandidates = useMemo(() => {
    const selectedIds = new Set(selectedParticipants.map((participant) => participant.id));
    const keyword = friendKeyword.trim().toLowerCase();

    return friendCandidates.filter((candidate) => {
      if (selectedIds.has(candidate.id)) return false;
      if (!keyword) return true;

      const displayName = (candidate.displayName || "").toLowerCase();
      const userName = (candidate.name || "").toLowerCase();
      return displayName.includes(keyword) || userName.includes(keyword);
    });
  }, [friendCandidates, selectedParticipants, friendKeyword]);

  const filteredRecordings = useMemo(() => {
    const normalizedKeyword = recordingKeyword.trim().toLowerCase();

    return recordings.filter((recording) => {
      const tagMatch =
        selectedTag === "全て" ||
        (Array.isArray(recording.emotions) && recording.emotions.includes(selectedTag));

      if (!tagMatch) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const title = (recording.title || "").toLowerCase();
      const description = (recording.description || "").toLowerCase();
      const emotionText = Array.isArray(recording.emotions) ? recording.emotions.join(" ").toLowerCase() : "";
      return title.includes(normalizedKeyword) || description.includes(normalizedKeyword) || emotionText.includes(normalizedKeyword);
    });
  }, [recordings, selectedTag, recordingKeyword]);

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
          ) : giftStyle === "collab" ? (
            "募集開始"
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
            placeholder="例: お誕生日おめでとう"
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

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 block">
            作成スタイル
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setGiftStyle("solo");
                setIssueShareLink(false);
                setSelectedParticipants([]);
              }}
              className={clsx(
                "rounded-xl border px-3 py-3 text-sm font-semibold",
                giftStyle === "solo"
                  ? "bg-[#2A5CAA] text-white border-[#2A5CAA]"
                  : "bg-white text-gray-600 border-gray-200"
              )}
              disabled={sending}
            >
              1人で作成
            </button>
            <button
              type="button"
              onClick={() => {
                setGiftStyle("collab");
                setSendMode("draft");
              }}
              className={clsx(
                "rounded-xl border px-3 py-3 text-sm font-semibold",
                giftStyle === "collab"
                  ? "bg-[#2A5CAA] text-white border-[#2A5CAA]"
                  : "bg-white text-gray-600 border-gray-200"
              )}
              disabled={sending}
            >
              複数人で作成
            </button>
          </div>

          {giftStyle === "collab" && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700">一緒に送るメンバー</p>
                <span className="text-[11px] text-gray-500">友達から追加</span>
              </div>

              <input
                type="text"
                value={friendKeyword}
                onChange={(e) => setFriendKeyword(e.target.value)}
                placeholder="友達を検索"
                className="w-full bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:border-[#2A5CAA] text-sm"
                disabled={sending}
              />

              {friendLoading ? (
                <p className="text-xs text-gray-500">友達リストを取得中...</p>
              ) : filteredFriendCandidates.length === 0 ? (
                <p className="text-xs text-gray-500">追加可能な友達が見つかりません。</p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {filteredFriendCandidates.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleAddParticipant(friend)}
                      className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-[#2A5CAA]/40"
                      disabled={sending}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                          {friend.avatarUrl && (
                            <img src={friend.avatarUrl} alt={friend.displayName || ""} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {friend.displayName || friend.name || "ユーザー"}
                          </p>
                          <p className="text-xs text-gray-500">@{friend.name || ""}</p>
                        </div>
                      </div>
                      <Plus size={16} className="text-[#2A5CAA]" />
                    </button>
                  ))}
                </div>
              )}

              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map((participant) => (
                    <span
                      key={participant.id}
                      className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs"
                    >
                      {participant.displayName || participant.name || "ユーザー"}
                      <button onClick={() => handleRemoveParticipant(participant.id)} type="button">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={issueShareLink}
                  onChange={(e) => setIssueShareLink(e.target.checked)}
                  className="mt-0.5"
                  disabled={sending}
                />
                <span className="flex-1">
                  募集開始時に共有リンクを発行してコピーする
                </span>
                <Link2 size={14} className="text-gray-400" />
              </label>
            </div>
          )}
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

          <div className="mb-4">
            <input
              type="text"
              value={recordingKeyword}
              onChange={(e) => setRecordingKeyword(e.target.value)}
              placeholder="キーワードで検索（タイトル・感情タグ）"
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:bg-white focus:border-[#2A5CAA] placeholder:text-gray-400 text-sm"
              disabled={sending}
            />
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
                const imageUrl = Array.isArray(recording.images) ? recording.images[0] : null;
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
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={recording.title}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                          <span className="text-5xl">{animalIcon}</span>
                        </div>
                      )}
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
          {giftStyle === "solo" ? (
            <div className="space-y-2">
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
                    "w-full py-3 rounded-xl text-sm font-semibold border",
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
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSendMode("draft")}
                className="w-full py-3 rounded-xl text-sm font-semibold border bg-[#2A5CAA] text-white border-[#2A5CAA]"
                disabled={sending}
              >
                募集開始
              </button>
              <p className="text-xs text-gray-500">
                募集開始するとドラフトが作成されます。メンバーが音声を追加した後、ドラフト画面から送信してください。
              </p>
            </div>
          )}
          {giftStyle === "solo" && sendMode === "scheduled" && (
            <div className="mt-3">
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                送信日時（1週間以内）
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={sendAt}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setSendAt("");
                      return;
                    }

                    const selected = new Date(value);
                    if (Number.isNaN(selected.getTime())) {
                      setSendAt(value);
                      return;
                    }

                    selected.setMinutes(0, 0, 0);
                    setSendAt(formatDateTimeLocal(selected));
                  }}
                  min={formatDateTimeLocal(minScheduleDate)}
                  max={formatDateTimeLocal(maxScheduleDate)}
                  step={3600}
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
          {giftStyle === "collab"
            ? "募集開始後はドラフト画面で共同メンバーの音声を集め、送信ボタンで最終送信します。"
            : "送信先を追加したあと、録音を選択してボイスギフトを保存してください。"}
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
