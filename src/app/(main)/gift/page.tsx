"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { Plus, Send, Users, Mail, Calendar, Heart, MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { clsx } from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import DateTimePickerInput from "@/components/DateTimePickerInput";
import { useVoiceGifts, VoiceGiftFilter } from "@/hooks/useVoiceGifts";
import { MizuhikiBow } from "@/components/shared/MizuhikiBow";

type GiftTabFilter = VoiceGiftFilter | "collaborative";

const filters: Array<{ id: GiftTabFilter; label: string; icon: any }> = [
  { id: "received", label: "届いた", icon: Mail },
  { id: "sent", label: "贈った", icon: Send },
  { id: "collaborative", label: "みんなで贈る", icon: Heart },
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

function GiftPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as GiftTabFilter) || "received";
  const [activeFilter, setActiveFilter] = useState<GiftTabFilter>(initialTab);
  const { user } = useUser();

  // みんなで贈るタブ用の寄せ音声リスト
  const [yosegakiList, setYosegakiList] = useState<any[]>([]);
  const [yosegakiLoading, setYosegakiLoading] = useState(false);
  const [yosegakiError, setYosegakiError] = useState<string | null>(null);

  // 下書きタブ用: 自分が作成した寄せ音声
  const [draftYosegakiList, setDraftYosegakiList] = useState<any[]>([]);

  // 贈ったタブ用: 自分が配信済みの寄せ音声
  const [deliveredYosegakiList, setDeliveredYosegakiList] = useState<any[]>([]);

  // 3点メニュー
  const [menuGiftId, setMenuGiftId] = useState<string | null>(null);

  // 編集モーダル
  type EditState = { gift: any; title: string; message: string; sendAt: string; recordingId: string };
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editRecordings, setEditRecordings] = useState<any[]>([]);
  const [editRecordingsLoaded, setEditRecordingsLoaded] = useState(false);
  const [showRecordingPicker, setShowRecordingPicker] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const fetchYosegakiList = useCallback(async () => {
    setYosegakiLoading(true);
    setYosegakiError(null);
    try {
      const res = await fetch("/api/yosegaki?type=collaborative");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setYosegakiList(data.yosegakiList || []);
    } catch (e: any) {
      setYosegakiError(e.message);
    } finally {
      setYosegakiLoading(false);
    }
  }, []);

  const fetchDraftYosegakiList = useCallback(async () => {
    try {
      const res = await fetch("/api/yosegaki?type=created");
      if (!res.ok) return;
      const data = await res.json();
      // 募集開始前（draft）のみ表示。collectingは「みんなで贈る」タブへ
      const list = (data.yosegakiList || []).filter(
        (y: any) => y.status === "draft"
      );
      setDraftYosegakiList(list);
    } catch {}
  }, []);

  const fetchDeliveredYosegakiList = useCallback(async () => {
    try {
      const res = await fetch("/api/yosegaki?type=delivered");
      if (!res.ok) return;
      const data = await res.json();
      setDeliveredYosegakiList(data.yosegakiList || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (activeFilter === "collaborative") fetchYosegakiList();
    if (activeFilter === "draft") fetchDraftYosegakiList();
    if (activeFilter === "sent") fetchDeliveredYosegakiList();
  }, [activeFilter, fetchYosegakiList, fetchDraftYosegakiList, fetchDeliveredYosegakiList]);

  // メニューを外側クリックで閉じる
  useEffect(() => {
    if (!menuGiftId) return;
    const close = () => setMenuGiftId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuGiftId]);

  const voiceGiftFilter = activeFilter === "collaborative" ? "received" : activeFilter;
  const { voiceGifts, loading, error, refresh } = useVoiceGifts(voiceGiftFilter as VoiceGiftFilter);
  const router = useRouter();

  async function handleDelete(giftId: string) {
    if (!confirm("このボイスギフトを削除しますか？")) return;
    try {
      const res = await fetch(`/api/voice-gifts/${giftId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  async function handleSendNow(giftId: string) {
    if (!confirm("このボイスギフトを今すぐ贈りますか？")) return;
    setMenuGiftId(null);
    try {
      const res = await fetch(`/api/voice-gifts/${giftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendNow: true }),
      });
      if (!res.ok) throw new Error("送信に失敗しました");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "送信に失敗しました");
    }
  }

  async function handleCancelSchedule(giftId: string) {
    if (!confirm("予約を取り消してもよいですか？下書きに戻ります。")) return;
    setMenuGiftId(null);
    try {
      const res = await fetch(`/api/voice-gifts/${giftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) throw new Error("取り消しに失敗しました");
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "取り消しに失敗しました");
    }
  }

  function handleEditOpen(gift: any) {
    const firstRecording = gift.recordings?.[0];
    setEditState({
      gift,
      title: gift.title || "",
      message: gift.message || "",
      sendAt: gift.sendAt ? new Date(gift.sendAt).toISOString().slice(0, 16) : "",
      recordingId: firstRecording?.recordingId || "",
    });
    setMenuGiftId(null);
    setShowRecordingPicker(false);
    if (!editRecordingsLoaded) {
      setEditRecordingsLoaded(true);
      fetch("/api/recordings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setEditRecordings(data?.recordings || []))
        .catch(() => {});
    }
  }

  async function handleEditSave() {
    if (!editState) return;
    if (!editState.title.trim()) { alert("宛名を入力してください"); return; }
    setEditSaving(true);
    try {
      const body: any = { title: editState.title.trim(), message: editState.message };
      const originalRecordingId = editState.gift.recordings?.[0]?.recordingId;
      if (editState.recordingId && editState.recordingId !== originalRecordingId) {
        body.recordingId = editState.recordingId;
      }
      if (editState.gift.status === "scheduled" && editState.sendAt) {
        body.sendAt = editState.sendAt;
      }
      const res = await fetch(`/api/voice-gifts/${editState.gift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      setEditState(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setEditSaving(false);
    }
  }

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

  // 寄せ音声版のみ表示する参加者アイコン（届いたタブ用）
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

  // 寄せ音声ステータスバッジ
  function yosegakiStatusLabel(yosegaki: any): string {
    const { status, deadline, deliverAt } = yosegaki;
    if (status === "draft") return "募集前";
    if (status === "collecting") {
      if (!deadline) return "募集中";
      const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
      if (days < 0) return "お届け待ち";
      return `募集中 締切まで${days}日`;
    }
    if (status === "completed" || status === "delivered") {
      if (!deliverAt) return "募集終了";
      const days = Math.ceil((new Date(deliverAt).getTime() - Date.now()) / 86400000);
      if (days < 0) return "贈り済み";
      return `お届けまで${days}日`;
    }
    return status;
  }

  // 下書きタブ内の寄せ音声カード
  function renderDraftYosegakiCard(yosegaki: any) {
    return (
      <Link key={`y-${yosegaki.id}`} href={`/gift/yosegaki/${yosegaki.id}`} className="block">
        <div className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center overflow-hidden">
                {yosegaki.organizerImageUrl ? (
                  <img src={yosegaki.organizerImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🎙️</span>
                )}
              </div>
              <div className="mt-1 flex flex-col items-center gap-1">
                <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">寄せ音声</span>
                <span className={`text-[8px] px-1 py-0.5 rounded-full whitespace-nowrap ${
                  yosegaki.status === "collecting"
                    ? "bg-amber-100 text-amber-700"
                    : yosegaki.status === "draft"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {yosegakiStatusLabel(yosegaki)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-bold text-[#2A5CAA] truncate">{yosegaki.recipientName}へ</p>
              <p className="text-xs text-gray-700 truncate">{yosegaki.title}</p>
              <p className="text-[10px] text-gray-400">{yosegaki.contributions?.length || 0}件の音声</p>
            </div>
          </div>
          <p className="absolute bottom-2 right-4 text-[10px] text-gray-400 whitespace-nowrap">
            {formatDateTime(yosegaki.createdAt)}
          </p>
        </div>
      </Link>
    );
  }

  // 贈ったタブ内の配信済み寄せ音声カード
  function renderDeliveredYosegakiCard(yosegaki: any) {
    const contributions = yosegaki.contributions || [];
    const totalCount = contributions.length + 1; // +1 for organizer
    const visibleContribs = contributions.slice(0, 3);
    const snippet = yosegaki.description
      ? yosegaki.description.slice(0, 55) + (yosegaki.description.length > 55 ? "…" : "")
      : null;
    const deliveredAt = yosegaki.deliverAt || yosegaki.updatedAt || yosegaki.createdAt;

    return (
      <Link key={`dy-${yosegaki.id}`} href={`/gift/yosegaki/${yosegaki.id}`} className="block">
        <div className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4 pb-7">
          <div className="flex items-start gap-3">
            {/* サムネイル + バッジ */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center overflow-hidden">
                {yosegaki.organizerImageUrl ? (
                  <img src={yosegaki.organizerImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🎙️</span>
                )}
              </div>
              <div className="mt-1 flex flex-col items-center gap-0.5">
                <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">寄せ音声</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium whitespace-nowrap">
                  お届け済み
                </span>
              </div>
            </div>

            {/* テキスト情報 */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-sm font-bold text-[#2A5CAA] truncate">{yosegaki.recipientName}へ</p>
              {snippet && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{snippet}</p>
              )}
              {/* 参加者アイコン列 */}
              <div className="flex items-center gap-1">
                {/* 企画者 */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-[8px] font-bold overflow-hidden ring-1 ring-white">
                  {yosegaki.creator?.avatarUrl ? (
                    <img src={yosegaki.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (yosegaki.organizerName?.[0] || "企").toUpperCase()
                  )}
                </div>
                {visibleContribs.map((c: any, i: number) => {
                  const name = c.participantName || c.contributor?.displayName || c.contributor?.name || "参";
                  return (
                    <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 flex items-center justify-center text-[8px] font-bold text-gray-600 overflow-hidden ring-1 ring-white">
                      {c.contributor?.avatarUrl ? (
                        <img src={c.contributor.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        name[0].toUpperCase()
                      )}
                    </div>
                  );
                })}
                {contributions.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[7px] font-semibold text-gray-500 ring-1 ring-white">
                    +{contributions.length - 3}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 ml-0.5">{totalCount}名参加</p>
              </div>
            </div>
          </div>
          <p className="absolute bottom-2 right-4 text-[10px] text-gray-400 whitespace-nowrap">
            {formatDateTime(deliveredAt)}
          </p>
        </div>
      </Link>
    );
  }

  // みんなで贈るタブのカード（寄せ音声）
  function renderYosegakiCard(yosegaki: any) {
    const contributions = yosegaki.contributions || [];
    // audioUrlありの投稿のみを参加者アイコン列に表示（招待のみは除外）
    const recordedContribs = contributions.filter((c: any) => c.audioUrl);
    const totalCount = recordedContribs.length + 1; // +1 for organizer
    const visibleContribs = recordedContribs.slice(0, 3);
    const isCreator = yosegaki.creatorId === user?.id;
    // audioUrlありで参加済み、なしで招待中（未参加）を判定
    const myContrib = contributions.find((c: any) => c.contributorId === user?.id);
    const hasRecorded = !!myContrib?.audioUrl;
    const isInvited = !!myContrib && !myContrib.audioUrl;

    // 締切/お届け情報
    const deadlineDays = yosegaki.deadline
      ? Math.ceil((new Date(yosegaki.deadline).getTime() - Date.now()) / 86400000)
      : null;
    const isDeadlinePassed = deadlineDays !== null && deadlineDays < 0;
    const deliverDays = yosegaki.deliverAt
      ? Math.ceil((new Date(yosegaki.deliverAt).getTime() - Date.now()) / 86400000)
      : null;

    return (
      <Link key={yosegaki.id} href={`/gift/yosegaki/${yosegaki.id}`} className="block">
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4 space-y-2">
          <div className="flex items-start gap-3">
            {/* サムネイル */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center overflow-hidden">
                {yosegaki.organizerImageUrl ? (
                  <img src={yosegaki.organizerImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🎙️</span>
                )}
              </div>
            </div>

            {/* テキスト情報 */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* 宛名 + 参加状況バッジ */}
              <div className="flex items-start justify-between gap-1">
                <p className="text-sm font-bold text-[#2A5CAA] truncate">{yosegaki.recipientName}へ</p>
                <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  isCreator
                    ? "bg-blue-100 text-blue-700"
                    : hasRecorded
                    ? "bg-green-100 text-green-700"
                    : isInvited
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {isCreator ? "企画者" : hasRecorded ? "参加済み" : "未参加"}
                </span>
              </div>
              {/* タイトル（宛名と異なる場合のみ） */}
              {yosegaki.title && yosegaki.title !== yosegaki.recipientName && (
                <p className="text-xs text-gray-700 truncate">{yosegaki.title}</p>
              )}
              {/* 募集ステータス */}
              {isDeadlinePassed ? (
                <p className="text-xs font-medium text-blue-500">
                  {deliverDays !== null && deliverDays >= 0 ? `お届けまで${deliverDays}日` : "お届け待ち"}
                </p>
              ) : deadlineDays !== null && (
                <p className={`text-xs font-medium ${deadlineDays <= 1 ? "text-red-500" : deadlineDays <= 3 ? "text-orange-500" : "text-amber-600"}`}>
                  締切まで{deadlineDays}日
                </p>
              )}
            </div>
          </div>

          {/* 参加者アイコン列 */}
          <div className="flex items-center gap-1 pt-0.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-[8px] font-bold overflow-hidden ring-1 ring-white">
              {yosegaki.creator?.avatarUrl ? (
                <img src={yosegaki.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (yosegaki.organizerName?.[0] || "企").toUpperCase()
              )}
            </div>
            {visibleContribs.map((c: any, i: number) => {
              const name = c.participantName || c.contributor?.displayName || "参";
              return (
                <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 flex items-center justify-center text-[8px] font-bold text-gray-600 overflow-hidden ring-1 ring-white">
                  {c.contributor?.avatarUrl ? (
                    <img src={c.contributor.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    name[0].toUpperCase()
                  )}
                </div>
              );
            })}
            {recordedContribs.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[7px] font-semibold text-gray-500 ring-1 ring-white">
                +{recordedContribs.length - 3}
              </div>
            )}
            <p className="text-[10px] text-gray-500 ml-0.5">{totalCount}名参加</p>
          </div>
        </div>
      </Link>
    );
  }

  // 四隅の装飾ダイヤモンド（内枠コーナーオーナメント）
  function CornerOrnament({ className }: { className?: string }) {
    return (
      <svg className={className} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <path d="M7 0 L9.2 4.8 L14 7 L9.2 9.2 L7 14 L4.8 9.2 L0 7 L4.8 4.8 Z" />
      </svg>
    );
  }

  // 「届いた」タブ: 封筒風カード（外枠＋クラシカル内枠・横線分割）
  function renderReceivedCard(gift: any) {
    return (
      <Link key={gift.id} href={`/gift/${gift.id}`} className="block">
        <div className="zen-kaku relative rounded-lg border-2 border-[#c9b99a] bg-gradient-to-b from-[#FEFBF6] to-[#FAF5EC] shadow-md hover:shadow-lg transition-all overflow-hidden">
          {/* 消印アイコン（右上・絶対配置） */}
          <img
            src="/icons/stamp1.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1 right-1 w-20 h-20 object-contain opacity-80 mix-blend-multiply"
          />

          {/* 内側クラシカル装飾枠 */}
          <div className="relative m-2.5 border border-[#b8956a]/60 rounded-sm">
            {/* 四隅のオーナメント */}
            <CornerOrnament className="absolute -top-[6px] -left-[6px] w-3 h-3 text-[#a07848]" />
            <CornerOrnament className="absolute -top-[6px] -right-[6px] w-3 h-3 text-[#a07848]" />
            <CornerOrnament className="absolute -bottom-[6px] -left-[6px] w-3 h-3 text-[#a07848]" />
            <CornerOrnament className="absolute -bottom-[6px] -right-[6px] w-3 h-3 text-[#a07848]" />

            {/* 上部エリア: 水引シンボル + タイトル */}
            <div className="px-4 pt-4 pb-4 flex flex-col items-center text-center">
              <MizuhikiBow className="w-20 h-7 mb-2 opacity-90" />
              <h4 className="text-base font-bold text-gray-800 px-10 w-full text-center truncate">
                {getGiftDisplayTitle(gift)}
              </h4>
              {renderCollabMeta(gift)}
            </div>

            {/* 中央横線 */}
            <div className="mx-4 border-t border-[#c9b99a]" />

            {/* 下部エリア: 差出人（○○より） */}
            <div className="px-4 py-3 flex justify-center">
              <p className="text-sm text-[#7a6a55] tracking-wide">{getSenderName(gift)}より</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // 「贈った / 下書き / 未来送信」タブの標準カード
  function renderStandardCard(gift: any) {
    const isActionable = activeFilter === "draft" || activeFilter === "scheduled";
    const isCollab = isCollabGift(gift);
    const participantUsers = isCollab ? getParticipantUsers(gift) : [];
    const recipientName = getRecipientName(gift);

    const inner = (
      <div className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4 pb-8">
        {/* 3点メニュー（下書き・未来送信のみ） */}
        {isActionable && (
          <>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuGiftId((prev) => (prev === gift.id ? null : gift.id)); }}
              className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="メニューを開く"
            >
              <MoreVertical size={16} />
            </button>
            {menuGiftId === gift.id && (
              <div
                className="absolute top-9 right-2 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[152px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => handleEditOpen(gift)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <Pencil size={14} className="text-gray-400 flex-shrink-0" />
                  編集
                </button>
                {activeFilter === "draft" && (
                  <button
                    type="button"
                    onClick={() => { setMenuGiftId(null); handleDelete(gift.id); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left"
                  >
                    <Trash2 size={14} className="flex-shrink-0" />
                    削除
                  </button>
                )}
                {activeFilter === "scheduled" && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => handleSendNow(gift.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2A5CAA] hover:bg-blue-50 text-left"
                    >
                      <Send size={14} className="flex-shrink-0" />
                      今すぐ贈る
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelSchedule(gift.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 text-left"
                    >
                      <X size={14} className="flex-shrink-0" />
                      予約を取り消す
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {renderThumb(gift)}
            {activeFilter === "draft" && isCollab && (
              <div className="mt-1 flex justify-center">
                <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">寄せ音声</span>
              </div>
            )}
          </div>

          <div className={clsx("flex-1 min-w-0 space-y-1", isActionable && "pr-6")}>
            {recipientName && (
              <p className="text-sm font-bold text-[#2A5CAA] truncate">{recipientName}へ</p>
            )}
            <h4 className="text-sm text-gray-800 truncate">{getGiftDisplayTitle(gift)}</h4>
            {gift.message && <p className="text-xs text-gray-600 truncate">{gift.message}</p>}

            {activeFilter === "draft" && isCollab && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">{participantUsers.length}名参加</span>
                {participantUsers.slice(0, 4).map((participant: any) => {
                  const displayName = participant.displayName || participant.name || "U";
                  return (
                    <div
                      key={participant.id}
                      title={displayName}
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white text-[8px] font-bold overflow-hidden"
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
            )}

            {activeFilter === "scheduled" && gift.sendAt && (
              <p className="text-[11px] text-amber-600">{formatScheduled(gift.sendAt)}</p>
            )}
          </div>
        </div>

        {activeFilter === "sent" && (
          <p className="absolute bottom-2 right-4 text-[10px] text-gray-400 whitespace-nowrap">
            {formatDateTime(gift.sendAt || gift.createdAt)}
          </p>
        )}
        {activeFilter === "draft" && (
          <p className="absolute bottom-2 right-4 text-[10px] text-gray-400 whitespace-nowrap">
            {formatDateTime(gift.createdAt)}
          </p>
        )}
      </div>
    );

    if (isActionable) {
      return (
        <div
          key={gift.id}
          className="cursor-pointer"
          onClick={() => {
            if (menuGiftId === gift.id) { setMenuGiftId(null); return; }
            router.push(`/gift/${gift.id}`);
          }}
        >
          {inner}
        </div>
      );
    }

    return (
      <Link key={gift.id} href={`/gift/${gift.id}`} className="block">
        {inner}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/Musuhi1.png" alt="Musuhi" className="h-[72px] w-auto object-contain" />
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

        {/* タブ: 1行横スクロール */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={clsx(
                  "px-2.5 py-1 text-[10px] rounded-full whitespace-nowrap transition-colors font-medium flex items-center gap-0.5 flex-shrink-0",
                  activeFilter === filter.id
                    ? "bg-[#2A5CAA] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Icon size={10} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* みんなで贈るタブ */}
        {activeFilter === "collaborative" ? (
          yosegakiLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : yosegakiError ? (
            <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
              <p className="text-red-500 mb-4">{yosegakiError}</p>
              <button onClick={fetchYosegakiList} className="px-6 py-2 bg-[#2A5CAA] text-white rounded-full">
                再試行
              </button>
            </div>
          ) : yosegakiList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-md">
              <Heart size={48} className="mx-auto mb-3 opacity-40 text-gray-400" />
              <p className="text-gray-500 text-sm">参加中の寄せ音声はありません</p>
              <Link href="/gift/new?mode=collab" className="mt-3 block text-xs text-[#2A5CAA]">
                声の寄せ書きを作る
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {yosegakiList.map((yosegaki: any) =>
                renderYosegakiCard(yosegaki)
              )}
            </div>
          )
        ) : loading ? (
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
        ) : voiceGifts.length === 0 && (activeFilter !== "draft" || draftYosegakiList.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-md">
            <Mail size={48} className="mx-auto mb-3 opacity-40 text-gray-400" />
            <p className="text-gray-500">ボイスギフトはまだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 下書きタブ: 寄せ音声カードを先頭に表示 */}
            {activeFilter === "draft" && draftYosegakiList.map((y) => renderDraftYosegakiCard(y))}
            {/* 贈ったタブ: 配信済み寄せ音声を先頭に表示 */}
            {activeFilter === "sent" && deliveredYosegakiList.map((y) => renderDeliveredYosegakiCard(y))}
            {voiceGifts.map((gift) =>
              activeFilter === "received" ? renderReceivedCard(gift) : renderStandardCard(gift)
            )}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editState && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditState(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
            <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">ボイスギフトを編集</h3>
                <button type="button" onClick={() => setEditState(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* 宛名 */}
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="text-xs font-bold text-gray-500">宛名</label>
                    <span className="text-[10px] text-gray-400">{editState.title.length}/20</span>
                  </div>
                  <input
                    type="text"
                    value={editState.title}
                    onChange={(e) => setEditState((prev) => prev ? { ...prev, title: e.target.value.slice(0, 20) } : null)}
                    maxLength={20}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500"
                  />
                </div>

                {/* 便箋メッセージ */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">便箋メッセージ</label>
                  <textarea
                    value={editState.message}
                    onChange={(e) => setEditState((prev) => prev ? { ...prev, message: e.target.value } : null)}
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 resize-none"
                  />
                </div>

                {/* お届け日時（未来送信のみ） */}
                {editState.gift.status === "scheduled" && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">お届け日時</label>
                    <DateTimePickerInput
                      value={editState.sendAt}
                      onChange={(v) => setEditState((prev) => prev ? { ...prev, sendAt: v } : null)}
                    />
                  </div>
                )}

                {/* 使用するジャーナル（ポラロイド差し替え） */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">使用するジャーナル</label>
                  {(() => {
                    const currentRec = editRecordings.find((r) => r.id === editState.recordingId)
                      ?? editState.gift.recordings?.[0]?.recording;
                    if (!currentRec) return <p className="text-xs text-gray-400 mb-2">録音なし</p>;
                    const imgUrl = Array.isArray(currentRec.images) ? currentRec.images[0] : null;
                    return (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-teal-100 to-blue-100">
                          {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base">🎵</div>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{currentRec.title}</p>
                      </div>
                    );
                  })()}
                  <button type="button" onClick={() => setShowRecordingPicker((v) => !v)} className="text-xs text-[#2A5CAA] hover:underline">
                    {showRecordingPicker ? "閉じる" : "差し替える"}
                  </button>
                  {showRecordingPicker && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {editRecordings.length === 0
                        ? <p className="text-xs text-gray-400 py-2">録音を読み込み中...</p>
                        : editRecordings.map((rec) => {
                          const imgUrl = Array.isArray(rec.images) ? rec.images[0] : null;
                          return (
                            <button
                              key={rec.id}
                              type="button"
                              onClick={() => { setEditState((prev) => prev ? { ...prev, recordingId: rec.id } : null); setShowRecordingPicker(false); }}
                              className={clsx("w-full flex items-center gap-3 p-2 rounded-xl border text-left", editState.recordingId === rec.id ? "border-[#2A5CAA] bg-blue-50" : "border-gray-100 hover:border-gray-300")}
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-teal-100 to-blue-100">
                                {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base">🎵</div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{rec.title}</p>
                                <p className="text-[10px] text-gray-400">{formatDate(rec.createdAt)}</p>
                              </div>
                              {editState.recordingId === rec.id && <Check size={16} className="text-[#2A5CAA] flex-shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">
                    ※ 音声データ・タイトル・録音日・テキストメモ等のポラロイド内容は変更できません
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={editSaving || !editState.title.trim()}
                  className="w-full py-3 rounded-xl bg-[#2A5CAA] text-white font-bold text-sm hover:bg-[#1F4580] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {editSaving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function GiftPage() {
  return (
    <Suspense>
      <GiftPageInner />
    </Suspense>
  );
}
