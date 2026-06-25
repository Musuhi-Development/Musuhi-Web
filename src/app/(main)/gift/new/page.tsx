"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, Play, Pause, Users, Mail, Calendar, Send, Plus, X, ArrowLeft } from "lucide-react";
import { useDebounce } from "use-debounce";
import { clsx } from "clsx";
import DateTimePickerInput from "@/components/DateTimePickerInput";

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

const emotionTags = [
  "全て",
  "嬉しい",
  "感謝",
  "楽しい",
  "幸せ",
  "ワクワク",
  "応援",
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
  const [senderName, setSenderName] = useState("");
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedTag, setSelectedTag] = useState("全て");
  const [recordingKeyword, setRecordingKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("draft");
  const [giftStyle, setGiftStyle] = useState<GiftCreationStyle>(
    searchParams.get("mode") === "collab" ? "collab" : "solo"
  );
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

  // 自分宛てに贈る
  const [sendToSelf, setSendToSelf] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserResult | null>(null);

  // アプリ未登録の友だちに贈る
  const [unregisteredMode, setUnregisteredMode] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState("");

  // 複数人で作成（寄せ音声）専用フィールド
  const [collabDeadline, setCollabDeadline] = useState("");
  const [collabDeliverAt, setCollabDeliverAt] = useState("");
  const [collabOrganizerComment, setCollabOrganizerComment] = useState("");
  const [collabOrganizerName, setCollabOrganizerName] = useState("");

  useEffect(() => {
    fetchRecordings();
    // 現在のログインユーザー情報を取得（自分宛て機能用）
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUserData({
            id: data.user.id,
            name: data.user.name,
            displayName: data.user.displayName,
            avatarUrl: data.user.avatarUrl,
          });
        }
      })
      .catch(() => {});
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
    if (unregisteredMode) {
      setRecipientResults([]);
      setRecipientLoading(false);
      return;
    }
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
  }, [debouncedQuery, unregisteredMode]);

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
      prev.includes(recordingId) ? [] : [recordingId]
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

  const handleSendToSelfToggle = (checked: boolean) => {
    setSendToSelf(checked);
    if (checked && currentUserData) {
      if (!selectedUsers.some((u) => u.id === currentUserData.id)) {
        setSelectedUsers((prev) => [...prev, currentUserData]);
      }
      if (!title.trim()) setTitle("未来の自分へ");
    } else if (currentUserData) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== currentUserData.id));
    }
  };

  const handleUnregisteredModeToggle = (checked: boolean) => {
    setUnregisteredMode(checked);
    setRecipientQuery("");
    setRecipientResults([]);
    setUnregisteredEmail("");
    setInviteEmail("");
  };

  const handleAddUnregisteredEmail = () => {
    const normalized = unregisteredEmail.trim().toLowerCase();
    if (!normalized) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      alert("正しいメールアドレスを入力してください");
      return;
    }
    if (recipientEmails.includes(normalized)) return;
    setRecipientEmails((prev) => [...prev, normalized]);
    setUnregisteredEmail("");
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
    const isCollab = giftStyle === "collab";

    if (!title.trim()) {
      alert("宛名を入力してください");
      return;
    }

    if (title.trim().length > 20) {
      alert("宛名は20文字以内で入力してください");
      return;
    }

    if (!isCollab && !message.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    // 1人で作成の場合のみ宛先チェック
    if (!isCollab && selectedUsers.length === 0 && recipientEmails.length === 0) {
      alert("宛先を1人以上追加してください");
      return;
    }

    if (!isCollab && selectedRecordingIds.length !== 1) {
      alert("音声を1つ選択してください");
      return;
    }
    // 複数人で作成（寄せ音声）は音声選択不要

    // 複数人で作成（寄せ音声）の必須チェック
    if (isCollab) {
      if (!collabDeadline) { alert("募集期限を入力してください"); return; }
      if (!collabDeliverAt) { alert("お届け日時を入力してください"); return; }
      if (!collabOrganizerComment.trim()) { alert("参加者への依頼コメントを入力してください"); return; }
      if (!collabOrganizerName.trim()) { alert("企画者名を入力してください"); return; }
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
      // 複数人で作成（寄せ音声）→ Yosegaki API
      if (isCollab) {
        // 選択済み録音の1件目を企画者ポラロイドとして使用
        const selectedRecording = selectedRecordingIds.length > 0
          ? recordings.find((r) => r.id === selectedRecordingIds[0]) ?? null
          : null;

        const res = await fetch("/api/yosegaki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: message.trim() || null,
            recipientName: title.trim(),
            recipientEmail: recipientEmails[0] || null,
            organizerName: collabOrganizerName.trim(),
            organizerComment: collabOrganizerComment.trim(),
            senderName: senderName.trim() || null,
            deadline: new Date(collabDeadline).toISOString(),
            deliverAt: new Date(collabDeliverAt).toISOString(),
            // 選択した録音を企画者ポラロイドとして反映
            organizerAudioUrl: selectedRecording?.audioUrl ?? null,
            organizerAudioTitle: selectedRecording?.title ?? null,
            organizerAudioComment: selectedRecording?.description ?? null,
            organizerImageUrl:
              Array.isArray(selectedRecording?.images) && selectedRecording.images.length > 0
                ? selectedRecording.images[0]
                : null,
            participantIds: selectedParticipants.map((p) => p.id),
          }),
        });
        if (!res.ok) throw new Error("寄せ音声の作成に失敗しました");
        const data = await res.json();
        // ドラフト画面をスキップして即座にcollecting状態へ移行
        await fetch(`/api/yosegaki/${data.yosegaki.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "collecting" }),
        });
        router.push(`/gift/yosegaki/${data.yosegaki.id}`);
        return;
      }

      // 1人で作成 → 既存 VoiceGift API
      const payload: any = {
        title: title.trim(),
        message: message.trim() || null,
        senderName: senderName.trim() || null,
        recipientIds: selectedUsers.map((user) => user.id),
        recipientEmails,
        participantIds: [],
        recordingIds: selectedRecordingIds,
        sendNow: sendMode === "now",
      };
      if (sendMode === "scheduled") payload.sendAt = new Date(sendAt).toISOString();

      const res = await fetch("/api/voice-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("ボイスギフトの作成に失敗しました");
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
    // 開始日は0時、終了日はその日の終わり(翌日0時)までを範囲に含める
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T00:00:00`).getTime() + 24 * 60 * 60 * 1000 : null;

    return recordings.filter((recording) => {
      const tagMatch =
        selectedTag === "全て" ||
        (Array.isArray(recording.emotions) && recording.emotions.includes(selectedTag));

      if (!tagMatch) {
        return false;
      }

      if (fromTime !== null || toTime !== null) {
        const recordedTime = new Date(recording.createdAt).getTime();
        if (Number.isNaN(recordedTime)) {
          return false;
        }
        if (fromTime !== null && recordedTime < fromTime) {
          return false;
        }
        if (toTime !== null && recordedTime >= toTime) {
          return false;
        }
      }

      if (!normalizedKeyword) {
        return true;
      }

      const title = (recording.title || "").toLowerCase();
      const description = (recording.description || "").toLowerCase();
      const emotionText = Array.isArray(recording.emotions) ? recording.emotions.join(" ").toLowerCase() : "";
      return title.includes(normalizedKeyword) || description.includes(normalizedKeyword) || emotionText.includes(normalizedKeyword);
    });
  }, [recordings, selectedTag, recordingKeyword, dateFrom, dateTo]);

  const primaryActionLabel = useMemo(() => {
    if (giftStyle === "collab") return "🔗 募集を開始する";
    if (sendMode === "draft") return "下書き保存";
    if (sendMode === "now") return "送信";
    return "予約送信";
  }, [giftStyle, sendMode]);

  return (
    <div className="pb-24 min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} disabled={sending} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-40">
            <ArrowLeft size={22} />
          </button>
          <span className="text-xl font-bold text-[#2A5CAA]">ボイスギフト作成</span>
        </div>
        {/* collab モードは本体下部の送信ボタンを使うためヘッダーボタンは非表示 */}
        {giftStyle !== "collab" && (
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
            ) : (
              primaryActionLabel
            )}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-bold text-gray-500 block">
              宛名 <span className="text-red-500">※</span>
            </label>
            <span className="text-[10px] text-gray-400">{title.length}/20</span>
          </div>
          <input
            type="text"
            placeholder='「お母さん」「田中さん」など、呼びかけたい名前'
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 20))}
            maxLength={20}
            disabled={sending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 block">
            宛先 <span className="text-red-500">※</span>
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
            {/* 通常モード: ユーザー検索 / 未登録モード: メール直接入力 */}
            {!unregisteredMode ? (
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
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    type="email"
                    value={unregisteredEmail}
                    onChange={(e) => setUnregisteredEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUnregisteredEmail()}
                    placeholder="贈り先のメールアドレスを入力"
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    onClick={handleAddUnregisteredEmail}
                    className="text-xs px-2 py-1 rounded-full bg-[#2A5CAA] text-white flex-shrink-0"
                    disabled={sending}
                  >
                    追加
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  ※アプリ未登録の相手には、メッセージ送信後に受け取り用の専用URL（Webページ）が発行されます。
                </p>
              </div>
            )}

            {/* 自分宛て / 未登録モード チェックボックス */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-200">
              <label className={clsx("flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none", unregisteredMode && "opacity-40")}>
                <input
                  type="checkbox"
                  checked={sendToSelf}
                  onChange={(e) => handleSendToSelfToggle(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={sending || unregisteredMode}
                />
                自分宛てに贈る
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unregisteredMode}
                  onChange={(e) => handleUnregisteredModeToggle(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={sending}
                />
                アプリ未登録の友だちに贈る
              </label>
            </div>

            {/* 通常モード: 検索結果 */}
            {!unregisteredMode && recipientLoading && (
              <div className="text-xs text-gray-400">検索中...</div>
            )}
            {!unregisteredMode && uniqueRecipientResults.length > 0 && (
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
            {!unregisteredMode && !recipientLoading && recipientQuery && uniqueRecipientResults.length === 0 && (
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
                setSelectedParticipants([]);
                // soloは音声1つのみ。複数選択済みなら先頭だけ残す
                setSelectedRecordingIds((prev) => prev.slice(0, 1));
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
              ) : filteredFriendCandidates.length === 0 ? null : (
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

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold text-blue-800">🔗このアプリ（Musuhi）を入れていない方への共有方法</p>
                <p className="text-xs text-blue-700">「募集を開始する」ボタンを押すと、専用のメッセージ受付URLが発行されます。アプリを入れていない方でも、LINEやメールでこのURLを開くだけで、スマホやPCのブラウザからすぐに音声を録音・参加できます</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── 複数人で作成（寄せ音声）専用フィールド ─── */}
        {giftStyle === "collab" && (
          <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-800">声の寄せ書き設定</p>

            {/* 募集期限 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                募集期限 <span className="text-red-500">※</span>
              </label>
              <DateTimePickerInput
                value={collabDeadline}
                onChange={setCollabDeadline}
                disabled={sending}
              />
            </div>

            {/* お届け日 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                お届け日時 <span className="text-red-500">※</span>
              </label>
              <DateTimePickerInput
                value={collabDeliverAt}
                onChange={setCollabDeliverAt}
                disabled={sending}
              />
            </div>

            {/* 参加者への依頼コメント */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                参加者への依頼コメント <span className="text-red-500">※</span>
              </label>
              <textarea
                placeholder="例: ○○さんの誕生日に贈る声の寄せ書きです。一言メッセージをお願いします！"
                value={collabOrganizerComment}
                onChange={(e) => setCollabOrganizerComment(e.target.value)}
                rows={3}
                disabled={sending}
                className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] placeholder:text-gray-400 resize-none text-sm"
              />
            </div>

            {/* 企画者名 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                企画者名 <span className="text-red-500">※</span>
              </label>
              <input
                type="text"
                placeholder="例: 山田（幹事）"
                value={collabOrganizerName}
                onChange={(e) => setCollabOrganizerName(e.target.value)}
                disabled={sending}
                className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] placeholder:text-gray-400 text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">宛先の方に表示される企画者名です</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            {giftStyle === "collab"
              ? "企画者ポラロイドに使う音声を選ぶ"
              : <>音声を選択（1つ）<span className="text-red-500"> ※</span></>}
          </label>
          {giftStyle === "collab" && (
            <p className="text-[11px] text-gray-400 mb-2">
              選択した録音の画像・タイトル・音声が、あなたのポラロイドとして寄せ書きの先頭に表示されます
            </p>
          )}
          {/* 選択済みポラロイドのプレビュー（collabのみ） */}
          {giftStyle === "collab" && selectedRecordingIds.length > 0 && (() => {
            const rec = recordings.find((r) => r.id === selectedRecordingIds[0]);
            if (!rec) return null;
            const imgUrl = Array.isArray(rec.images) ? rec.images[0] : null;
            return (
              <div className="mb-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-100 to-rose-100">
                  {imgUrl
                    ? <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-amber-700 mb-0.5">企画者ポラロイドとして設定</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{rec.title}</p>
                </div>
              </div>
            );
          })()}
          <div className="flex flex-wrap gap-2 mb-4">
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
              placeholder="キーワードで検索"
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:bg-white focus:border-[#2A5CAA] placeholder:text-gray-400 text-sm"
              disabled={sending}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500">録音日で検索</span>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs text-[#2A5CAA] font-medium hover:underline"
                  disabled={sending}
                >
                  クリア
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="録音日の開始日"
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:bg-white focus:border-[#2A5CAA] text-sm"
                disabled={sending}
              />
              <span className="text-gray-400 text-sm">〜</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="録音日の終了日"
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:bg-white focus:border-[#2A5CAA] text-sm"
                disabled={sending}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">
                {selectedTag === "全て" && !recordingKeyword && !dateFrom && !dateTo
                  ? "録音がありません"
                  : "条件に合う録音がありません"}
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
                const animalImageSrc =
                  recording.emotions && recording.emotions.length > 0
                    ? (emotionToAnimal[recording.emotions[0]] ?? null)
                    : null;

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
                          {animalImageSrc ? (
                            <img src={animalImageSrc} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-5xl">🎵</span>
                          )}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            メッセージ <span className="text-red-500">※</span>
          </label>
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
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            贈り主
          </label>
          <input
            type="text"
            placeholder="例：山田太郎、３年２組 生徒一同"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            disabled={sending}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400"
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
                onClick={handleSend}
                className="w-full py-3 rounded-xl text-sm font-semibold border bg-[#2A5CAA] text-white border-[#2A5CAA]"
                disabled={sending}
              >
                {sending ? "処理中..." : "🔗 募集を開始する"}
              </button>
            </div>
          )}
          {giftStyle === "solo" && sendMode === "scheduled" && (
            <div className="mt-3">
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                送信日時（1週間以内）
              </label>
              <DateTimePickerInput
                value={sendAt}
                onChange={setSendAt}
                disabled={sending}
                minDate={formatDateTimeLocal(minScheduleDate).slice(0, 10)}
                maxDate={formatDateTimeLocal(maxScheduleDate).slice(0, 10)}
              />
            </div>
          )}
          {giftStyle === "solo" && (
            <button
              type="button"
              onClick={handleSend}
              className="w-full mt-4 py-3 rounded-xl text-sm font-semibold border bg-[#2A5CAA] text-white border-[#2A5CAA] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  送信中...
                </>
              ) : (
                primaryActionLabel
              )}
            </button>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 flex items-center gap-2">
          <Send size={14} />
          {giftStyle === "collab"
            ? "募集開始後は、専用リンクをLINEやメールで共有してメンバーの音声メッセージを集めます。設定したお届け日時になると、集まったメッセージが自動で相手に届きます"
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
