"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Copy, Check, Share2, QrCode, Mic, Image, Plus, Pencil, Play, Pause, X, ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { MizuhikiBow } from "@/components/shared/MizuhikiBow";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import DateTimePickerInput from "@/components/DateTimePickerInput";

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmt(d: string | Date | null | undefined) {
  if (!d) return "–";
  const date = new Date(d);
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function deadlineDaysLeft(deadline: string | null | undefined): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "募集終了";
  if (days === 0) return "本日締切";
  return `締切まで${days}日`;
}

const TILT_CLASSES = [
  "-rotate-[2deg]", "rotate-[1.5deg]", "-rotate-[1deg]", "rotate-[2.5deg]",
  "-rotate-[0.5deg]", "rotate-[1deg]", "-rotate-[2deg]", "rotate-[0.5deg]",
];

function PolaroidCard({
  imageUrl,
  title,
  name,
  audioUrl,
  audioDuration,
  isOrganizer,
  index,
  onClick,
}: {
  imageUrl?: string | null;
  title?: string | null;
  name: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
  isOrganizer?: boolean;
  index: number;
  onClick?: () => void;
}) {
  const tilt = TILT_CLASSES[index % TILT_CLASSES.length];
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-sm shadow-md p-2 pb-6 flex flex-col gap-1 text-left transition-transform hover:scale-[1.02] ${tilt}`}
      style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.15)" }}
    >
      <div className="w-full aspect-square bg-gradient-to-br from-amber-100 to-rose-100 rounded-sm overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🎵</div>
        )}
      </div>
      <p className="text-[10px] text-gray-600 font-medium truncate leading-tight mt-1 px-0.5">
        {title || "（タイトルなし）"}
      </p>
      <div className="flex items-center gap-0.5 px-0.5">
        {isOrganizer && (
          <img src="/icons/mizuhiki-bow.png" alt="" className="w-4 h-3 object-contain" aria-hidden />
        )}
        <p className="text-[9px] text-gray-400 truncate">{name}</p>
      </div>
    </button>
  );
}

function LetterView({ recipientName, message, organizerName, senderName }: { recipientName: string; message: string; organizerName?: string; senderName?: string }) {
  return (
    <div
      className="relative rounded-2xl bg-[#FAF7F2] shadow-sm px-6 py-6 pb-10"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 31px, rgba(120,95,55,0.10) 31px, rgba(120,95,55,0.10) 32px)",
      }}
    >
      <MizuhikiBow className="absolute top-3 right-4 w-20 h-6 opacity-80" />
      <p className="text-lg font-bold text-gray-800 mb-4">{recipientName}へ</p>
      <p className="text-sm text-gray-700 leading-[2rem] whitespace-pre-wrap min-h-[3rem]">{message}</p>
      {(senderName || organizerName) && (
        <p className="absolute bottom-3 right-5 text-xs text-gray-400">{senderName || organizerName}より</p>
      )}
    </div>
  );
}

function QrCodeView({ url }: { url: string }) {
  const encoded = encodeURIComponent(url);
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=160x160&margin=2`}
      alt="QRコード"
      className="w-40 h-40 rounded-lg"
    />
  );
}

export default function YosegakiDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useUser();

  const [yosegaki, setYosegaki] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集用
  const [deliverAt, setDeliverAt] = useState("");
  const [updating, setUpdating] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // モーダル
  const [modal, setModal] = useState<any | null>(null);

  // 録音選択（ボイスアルバムから）
  const [recordings, setRecordings] = useState<any[]>([]);
  const [showAlbum, setShowAlbum] = useState(false);
  const [addingRecording, setAddingRecording] = useState(false);

  // 参加者用
  const [participantName, setParticipantName] = useState("");
  const [showParticipantAlbum, setShowParticipantAlbum] = useState(false);
  const [participantAlbumSelected, setParticipantAlbumSelected] = useState<string | null>(null);
  const [participantAlbumSubmitting, setParticipantAlbumSubmitting] = useState(false);
  const [participantDone, setParticipantDone] = useState(false);
  const [albumPreviewId, setAlbumPreviewId] = useState<string | null>(null);
  const albumAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { if (id) { fetchYosegaki(); } }, [id]);
  useEffect(() => {
    if (user && yosegaki?.status === "collecting") fetchRecordings();
  }, [user, yosegaki?.status]);
  useEffect(() => {
    if (user && !participantName) setParticipantName(user.displayName || user.name || "");
  }, [user]);
  useEffect(() => {
    if (yosegaki?.status === "delivered" && yosegaki?.shareToken) {
      router.replace(`/yosegaki/${yosegaki.shareToken}/view?sender=1`);
    }
  }, [yosegaki?.status, yosegaki?.shareToken]);

  async function fetchYosegaki() {
    setLoading(true);
    try {
      const res = await fetch(`/api/yosegaki/${id}`);
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setYosegaki(data.yosegaki);
      if (data.yosegaki.deliverAt) {
        const d = new Date(data.yosegaki.deliverAt);
        setDeliverAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecordings() {
    const res = await fetch("/api/recordings");
    if (res.ok) {
      const data = await res.json();
      setRecordings(data.recordings || []);
    }
  }

  const isCreator = yosegaki?.creatorId === user?.id;
  const hasContributed = yosegaki?.contributions?.some((c: any) => c.contributorId === user?.id);

  const shareUrl = yosegaki ? `${typeof window !== "undefined" ? window.location.origin : ""}/yosegaki/${yosegaki.shareToken}` : "";

  const shareText = yosegaki
    ? `【声の寄せ書き参加のお願い】\n宛名: ${yosegaki.recipientName}\n企画者: ${yosegaki.organizerName}\n\n${yosegaki.organizerComment || ""}\n\n募集期限: ${fmt(yosegaki.deadline)}\n\n参加はこちら👇\n${shareUrl}`
    : "";

  async function handleStartCollecting() {
    if (!isCreator || starting) return;
    setStarting(true);
    try {
      await fetch(`/api/yosegaki/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "collecting" }),
      });
      await fetchYosegaki();
    } finally {
      setStarting(false);
    }
  }

  async function handleUpdateDeliverAt() {
    if (!isCreator || updating) return;
    setUpdating(true);
    try {
      await fetch(`/api/yosegaki/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverAt: new Date(deliverAt).toISOString() }),
      });
      await fetchYosegaki();
    } finally {
      setUpdating(false);
    }
  }

  async function handleSendNow() {
    if (!isCreator || sendingNow) return;
    setSendingNow(true);
    try {
      const res = await fetch(`/api/yosegaki/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered", deliverAt: new Date().toISOString() }),
      });
      if (res.ok) {
        router.push("/gift?tab=sent");
      } else {
        await fetchYosegaki();
      }
    } finally {
      setSendingNow(false);
    }
  }

  async function handleAddFromAlbum(recordingId: string) {
    if (addingRecording) return;
    setAddingRecording(true);
    try {
      const recording = recordings.find((r) => r.id === recordingId);
      await fetch(`/api/yosegaki/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingId,
          imageUrl: Array.isArray(recording?.images) ? recording.images[0] : null,
          audioUrl: recording?.audioUrl,
          audioDuration: recording?.duration,
          title: recording?.title,
          message: recording?.description,
        }),
      });
      setShowAlbum(false);
      await fetchYosegaki();
    } finally {
      setAddingRecording(false);
    }
  }

  function handleCopy(text: string, setCopied_: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied_(true);
      setTimeout(() => setCopied_(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error || !yosegaki) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error || "見つかりません"}</p>
        <button onClick={() => router.back()} className="text-[#2A5CAA]">戻る</button>
      </div>
    );
  }

  const status = yosegaki.status;
  const allContribs: any[] = yosegaki.contributions || [];
  const isDeadlinePassed = yosegaki.deadline ? new Date() > new Date(yosegaki.deadline) : false;
  const myContrib = allContribs.find((c: any) => c.contributorId === user?.id);
  const myContribHasAudio = !!(myContrib?.audioUrl);

  function closeParticipantAlbum() {
    if (albumAudioRef.current) { albumAudioRef.current.pause(); albumAudioRef.current = null; }
    setAlbumPreviewId(null);
    setShowParticipantAlbum(false);
    setParticipantAlbumSelected(null);
  }

  function toggleAlbumPreview(r: any, e: React.MouseEvent) {
    e.stopPropagation();
    if (albumPreviewId === r.id) {
      albumAudioRef.current?.pause();
      albumAudioRef.current = null;
      setAlbumPreviewId(null);
    } else {
      if (albumAudioRef.current) { albumAudioRef.current.pause(); }
      const audio = new Audio(r.audioUrl);
      audio.onended = () => setAlbumPreviewId(null);
      audio.play().catch(() => {});
      albumAudioRef.current = audio;
      setAlbumPreviewId(r.id);
    }
  }

  // 参加者がボイスアルバムから投稿
  async function handleParticipantAlbumSubmit() {
    if (!participantAlbumSelected || participantAlbumSubmitting) return;
    setParticipantAlbumSubmitting(true);
    try {
      const recording = recordings.find((r: any) => r.id === participantAlbumSelected);
      const name = participantName.trim() || user?.displayName || user?.name || "名前なし";
      const method = myContrib ? "PATCH" : "POST";
      const body = myContrib
        ? JSON.stringify({
            contributionId: myContrib.id,
            participantName: name,
            imageUrl: Array.isArray(recording?.images) ? recording.images[0] : null,
            audioUrl: recording?.audioUrl,
            audioDuration: recording?.duration,
            title: recording?.title,
            message: recording?.description,
          })
        : JSON.stringify({
            participantName: name,
            imageUrl: Array.isArray(recording?.images) ? recording.images[0] : null,
            audioUrl: recording?.audioUrl,
            audioDuration: recording?.duration,
            title: recording?.title,
            message: recording?.description,
          });
      await fetch(`/api/yosegaki/${id}/contributions`, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      closeParticipantAlbum();
      setParticipantDone(true);
      await fetchYosegaki();
    } finally {
      setParticipantAlbumSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() =>
            status === "delivered"
              ? router.push("/gift?tab=sent")
              : router.push("/gift?tab=collaborative")
          }
          className="text-gray-500"
        >
          <X size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{yosegaki.recipientName}への声の寄せ書き</p>
          <p className="text-[11px] text-gray-400 truncate">企画: {yosegaki.organizerName}</p>
        </div>
        <StatusBadge status={status} deadline={yosegaki.deadline} />
      </header>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* ───── ドラフト画面 ───── */}
        {status === "draft" && (
          <>
            <LetterView recipientName={yosegaki.recipientName} message={yosegaki.description || ""} senderName={yosegaki.senderName ?? undefined} organizerName={yosegaki.organizerName} />

            {/* 企画者ポラロイド */}
            <OrganizerPolaroid yosegaki={yosegaki} isCreator={isCreator} onRefresh={fetchYosegaki} id={id} />

            {/* 募集期限・依頼コメント */}
            <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <InfoRow label="募集期限" value={fmt(yosegaki.deadline)} />
              {yosegaki.organizerComment && (
                <InfoRow label="参加者への依頼コメント" value={yosegaki.organizerComment} multiline />
              )}
            </div>

            {/* お届け日時設定 */}
            {isCreator && (
              <DeliverAtSection
                deliverAt={deliverAt}
                setDeliverAt={setDeliverAt}
                onUpdate={handleUpdateDeliverAt}
                updating={updating}
              />
            )}

            {/* 共有リンク発行 */}
            {isCreator && (
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-700">共有リンクを発行して募集を開始</h3>
                <p className="text-xs text-gray-500">参加者への依頼コメントの確認後、募集を開始してください。</p>
                <button
                  onClick={handleStartCollecting}
                  disabled={starting}
                  className="w-full bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold py-3 rounded-full shadow-md disabled:opacity-50"
                >
                  {starting ? "開始中…" : "🔗 募集を開始する"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ───── コレクティング画面 / 企画者 ───── */}
        {status === "collecting" && isCreator && (
          <>
            <OrganizerPolaroid yosegaki={yosegaki} isCreator={true} onRefresh={fetchYosegaki} id={id} />
            <LetterView recipientName={yosegaki.recipientName} message={yosegaki.description || ""} senderName={yosegaki.senderName ?? undefined} organizerName={yosegaki.organizerName} />

            {/* 共有URL + QR */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Share2 size={15} /> 共有URL
              </h3>
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-all select-all">
                {shareUrl}
              </p>
              <div className="flex flex-col items-center gap-3">
                <QrCodeView url={shareUrl} />
                <div className="w-full space-y-2">
                  <button onClick={() => handleCopy(shareUrl, setCopiedUrl)} className="w-full border border-[#2A5CAA] text-[#2A5CAA] bg-white py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                    {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUrl ? "コピーしました！" : "URLのみコピー"}
                  </button>
                  <button onClick={() => handleCopy(shareText, setCopiedShare)} className="w-full bg-[#2A5CAA] text-white py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                    {copiedShare ? <Check size={14} /> : <Copy size={14} />}
                    {copiedShare ? "コピーしました！" : "招待メッセージをコピー"}
                  </button>
                </div>
              </div>
            </div>

            {/* 招待メンバー一覧 */}
            <InvitedMemberList contributions={allContribs} />

            {/* 集まった声 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">集まった声 ({allContribs.filter((c: any) => c.audioUrl).length}件)</h3>
              {allContribs.filter((c: any) => c.audioUrl).length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800 leading-relaxed">
                  さあ、みんなの『声』を集めましょう！上の <strong>共有URL</strong> や <strong>招待メッセージ</strong> をコピーして、一緒にメッセージを贈りたいメンバーにシェアしてください。参加者が録音を完了すると、この場所にリアルタイムでメッセージが追加されていきます
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {allContribs.filter((c: any) => c.audioUrl).map((c: any, i: number) => (
                    <PolaroidCard
                      key={c.id}
                      imageUrl={c.imageUrl || (Array.isArray(c.recording?.images) ? c.recording.images[0] : null)}
                      title={c.title || c.recording?.title}
                      name={c.participantName || "参加者"}
                      audioUrl={c.audioUrl || c.recording?.audioUrl}
                      index={i}
                      onClick={() => setModal(c)}
                    />
                  ))}
                </div>
              )}
            </div>

            <DeliverAtSection deliverAt={deliverAt} setDeliverAt={setDeliverAt} onUpdate={handleUpdateDeliverAt} updating={updating} />
            {allContribs.filter((c: any) => c.audioUrl).length === 0 ? (
              <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-3 rounded-full cursor-not-allowed">🎁 今すぐ贈る</button>
            ) : (
              <button onClick={() => setShowSendConfirm(true)} disabled={sendingNow} className="w-full border border-[#2A5CAA] text-[#2A5CAA] bg-white font-bold py-3 rounded-full disabled:opacity-50">
                {sendingNow ? "贈り中…" : "🎁 今すぐ贈る"}
              </button>
            )}
          </>
        )}

        {/* ───── コレクティング画面 / 参加者 ───── */}
        {status === "collecting" && !isCreator && (
          <>
            {/* 参加完了メッセージ */}
            {participantDone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-1">
                <p className="text-sm font-bold text-emerald-700">参加完了！</p>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  あなたの声が、みんなで届けるボイスギフト（寄せ音声）に加わりました。{yosegaki.recipientName}さんへの想いを届けていただき、ありがとうございます
                </p>
              </div>
            )}

            {/* 基本情報 */}
            <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">宛名</p>
                <p className="text-sm font-bold text-[#2A5CAA]">{yosegaki.recipientName}へ</p>
              </div>
              {yosegaki.deadline && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-0.5">募集期限</p>
                  <p className={`text-sm font-medium ${isDeadlinePassed ? "text-gray-400" : "text-amber-700"}`}>
                    {fmt(yosegaki.deadline)}{isDeadlinePassed ? "（受付終了）" : ""}
                  </p>
                </div>
              )}
              {yosegaki.organizerComment && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-0.5">企画者からのコメント</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{yosegaki.organizerComment}</p>
                </div>
              )}
            </div>

            {/* 参加済み: 自分のポラロイド表示 */}
            {myContribHasAudio && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">あなたの投稿</p>
                  {!isDeadlinePassed && (
                    <button
                      onClick={() => router.push(`/gift/yosegaki/${id}/contribute`)}
                      className="text-xs text-[#2A5CAA] font-medium underline"
                    >
                      編集する
                    </button>
                  )}
                </div>
                <MyContribPolaroid contrib={myContrib} />
              </div>
            )}

            {/* 未参加: アクションボタン */}
            {!myContribHasAudio && !isDeadlinePassed && (
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/gift/yosegaki/${id}/contribute`)}
                  className="w-full bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold py-4 rounded-full shadow-md text-sm flex items-center justify-center gap-2"
                >
                  <Mic size={16} /> 新しく録音する
                </button>
                <button
                  onClick={() => { fetchRecordings(); setShowParticipantAlbum(true); }}
                  className="w-full border border-[#2A5CAA] text-[#2A5CAA] bg-white font-bold py-4 rounded-full text-sm flex items-center justify-center gap-2"
                >
                  <Image size={16} /> ボイスアルバムから選ぶ
                </button>
              </div>
            )}

            {!myContribHasAudio && isDeadlinePassed && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <p className="text-sm text-gray-500">この声の寄せ書きは募集期限を過ぎています</p>
              </div>
            )}
          </>
        )}

        {/* ───── 完成版・送信後 / 企画者 ───── */}
        {(status === "completed" || status === "delivered") && isCreator && (
          <>
            <LetterView recipientName={yosegaki.recipientName} message={yosegaki.description || ""} senderName={yosegaki.senderName ?? undefined} organizerName={yosegaki.organizerName} />
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">みんなの声 ({allContribs.filter((c: any) => c.audioUrl).length + 1}件)</h3>
              <div className="grid grid-cols-3 gap-3">
                <PolaroidCard
                  imageUrl={yosegaki.organizerImageUrl}
                  title={yosegaki.organizerAudioTitle}
                  name={yosegaki.organizerName}
                  audioUrl={yosegaki.organizerAudioUrl}
                  isOrganizer
                  index={0}
                  onClick={() => setModal({ imageUrl: yosegaki.organizerImageUrl, title: yosegaki.organizerAudioTitle, participantName: yosegaki.organizerName, audioUrl: yosegaki.organizerAudioUrl, message: yosegaki.organizerAudioComment, isOrganizer: true })}
                />
                {allContribs.filter((c: any) => c.audioUrl).map((c: any, i: number) => (
                  <PolaroidCard
                    key={c.id}
                    imageUrl={c.imageUrl || (Array.isArray(c.recording?.images) ? c.recording.images[0] : null)}
                    title={c.title || c.recording?.title}
                    name={c.participantName || c.contributor?.displayName || c.contributor?.name || "参加者"}
                    audioUrl={c.audioUrl || c.recording?.audioUrl}
                    index={i + 1}
                    onClick={() => setModal(c)}
                  />
                ))}
              </div>
            </div>
            {isCreator && status !== "delivered" && (
              <DeliverAtSection deliverAt={deliverAt} setDeliverAt={setDeliverAt} onUpdate={handleUpdateDeliverAt} updating={updating} />
            )}
          </>
        )}

        {/* ───── 完成版・送信後 / 参加者（閲覧専用） ───── */}
        {(status === "completed" || status === "delivered") && !isCreator && (
          <>
            <div className="text-center py-2">
              <p className="text-sm font-bold text-gray-700">{yosegaki.recipientName}さんへこのメッセージを届けました</p>
            </div>
            {myContrib && myContrib.audioUrl ? (
              <MyContribPolaroid contrib={myContrib} />
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <p className="text-sm text-gray-400">このギフトへの投稿はありません</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ボイスアルバム選択モーダル */}
      {showAlbum && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">ボイスアルバムから選ぶ</h3>
              <button onClick={() => setShowAlbum(false)} className="text-gray-500 text-sm">閉じる</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recordings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">録音がありません</p>
              ) : (
                recordings.map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => handleAddFromAlbum(r.id)}
                    disabled={addingRecording}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {Array.isArray(r.images) && r.images[0] ? (
                        <img src={r.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">{Math.round(r.duration)}秒</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 今すぐ贈る確認ダイアログ */}
      {showSendConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <p className="text-base font-bold text-gray-800">本当に今すぐ送信しますか？</p>
            <p className="text-sm text-gray-600">
              設定されたお届け日時を待たずに、現時点で集まっているメッセージ（計{allContribs.length}件）を相手に届けます
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-full text-sm font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowSendConfirm(false); handleSendNow(); }}
                disabled={sendingNow}
                className="flex-1 bg-[#2A5CAA] text-white py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {sendingNow ? "送信中…" : "送信する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 参加者：ボイスアルバム選択モーダル */}
      {showParticipantAlbum && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-[#FAF7F2] w-full rounded-t-3xl max-h-[85vh] flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-white rounded-t-3xl">
              <h3 className="font-bold text-gray-800">ボイスアルバムから選ぶ</h3>
              <button
                type="button"
                onClick={closeParticipantAlbum}
                aria-label="閉じる"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* 表示名入力 */}
            <div className="px-5 pt-4 pb-3 border-b bg-white">
              <label className="text-[11px] font-bold text-gray-500 mb-1 block">ボイスギフトに表示される名前</label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder={user?.displayName || user?.name || "名前を入力"}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2A5CAA]"
              />
            </div>

            {/* グリッド（縦スクロール） */}
            <div className="flex-1 overflow-y-auto p-4">
              {recordings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">録音がありません</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {recordings.map((r: any) => {
                    const selected = participantAlbumSelected === r.id;
                    const playing = albumPreviewId === r.id;
                    const imageUrl = Array.isArray(r.images) ? r.images[0] : null;
                    return (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setParticipantAlbumSelected(selected ? null : r.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setParticipantAlbumSelected(selected ? null : r.id); } }}
                        className={`bg-white rounded-sm shadow-md p-1.5 pb-5 cursor-pointer border-2 transition-all focus:outline-none ${
                          selected ? "border-[#2A5CAA]" : "border-transparent"
                        }`}
                        style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.15)" }}
                      >
                        {/* サムネイル + 再生ボタン */}
                        <div className="relative w-full aspect-square mb-1.5">
                          {imageUrl ? (
                            <img src={imageUrl} alt={r.title} className="w-full h-full object-cover rounded-sm" />
                          ) : (
                            <div className="w-full h-full rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                              <span className="text-3xl">🎵</span>
                            </div>
                          )}
                          {/* 再生/停止オーバーレイ */}
                          <button
                            type="button"
                            onClick={(e) => toggleAlbumPreview(r, e)}
                            aria-label={playing ? "停止" : "再生"}
                            className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/25 hover:bg-black/35 transition-colors"
                          >
                            {playing ? (
                              <Pause size={20} className="text-white drop-shadow" />
                            ) : (
                              <Play size={20} className="text-white drop-shadow" />
                            )}
                          </button>
                          {selected && (
                            <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 bg-white/90 text-[#2A5CAA] font-bold rounded-full shadow-sm">
                              選択中
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-700 font-medium truncate leading-tight px-0.5">
                          {r.title || "（タイトルなし）"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* アクションボタン（中央配置・文字幅） */}
            <div className="flex justify-center px-5 py-4 bg-white border-t">
              <button
                type="button"
                onClick={handleParticipantAlbumSubmit}
                disabled={!participantAlbumSelected || participantAlbumSubmitting}
                className="bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold px-8 py-3 rounded-full shadow-md disabled:opacity-40 text-sm"
              >
                {participantAlbumSubmitting ? "送信中…" : "この声を贈る"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {modal && (
        <ContribModal contrib={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function collectingLabel(deadline?: string | null): string {
  if (!deadline) return "🟢 募集中";
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "🟢 募集中（締切済み）";
  if (days === 0) return "🟢 募集中（本日締切）";
  return `🟢 募集中（残り${days}日）`;
}

function StatusBadge({ status, deadline }: { status: string; deadline?: string | null }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "募集前", className: "bg-gray-100 text-gray-500" },
    collecting: { label: collectingLabel(deadline), className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    completed: { label: "募集終了", className: "bg-blue-100 text-blue-700" },
    delivered: { label: "贈り済み", className: "bg-green-100 text-green-700" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
  );
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 mb-0.5">{label}</p>
      {multiline ? (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm text-gray-700">{value}</p>
      )}
    </div>
  );
}

function DeliverAtSection({
  deliverAt,
  setDeliverAt,
  onUpdate,
  updating,
}: {
  deliverAt: string;
  setDeliverAt: (v: string) => void;
  onUpdate: () => void;
  updating: boolean;
}) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-gray-700">お届け日時</h3>
      <DateTimePickerInput value={deliverAt} onChange={setDeliverAt} />
      <button
        onClick={onUpdate}
        disabled={updating}
        className="w-full bg-white border border-[#2A5CAA] text-[#2A5CAA] py-2 rounded-full text-sm font-semibold disabled:opacity-50"
      >
        {updating ? "更新中…" : "お届け日時の変更"}
      </button>
    </div>
  );
}

function OrganizerPolaroid({
  yosegaki,
  isCreator,
  onRefresh,
  id,
}: {
  yosegaki: any;
  isCreator: boolean;
  onRefresh: () => void;
  id: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(yosegaki.organizerAudioTitle || "");
  const [imageUrl, setImageUrl] = useState(yosegaki.organizerImageUrl || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/yosegaki/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizerImageUrl: imageUrl, organizerAudioTitle: title }),
    });
    setSaving(false);
    setEditing(false);
    onRefresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <img src="/icons/mizuhiki-bow.png" alt="" className="w-5 h-4 object-contain" aria-hidden />
          <p className="text-sm font-bold text-gray-700">{yosegaki.organizerName}</p>
        </div>
        {isCreator && (
          <button onClick={() => setEditing(!editing)} className="text-xs text-[#2A5CAA]">
            <Pencil size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">画像URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">タイトル（20文字以内）</label>
            <input
              type="text"
              maxLength={20}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#2A5CAA] text-white py-2 rounded-full text-sm font-bold disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      ) : (
        <div
          className="relative bg-[#F3EBDD] rounded-2xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
            backgroundSize: "5px 5px",
            backgroundPosition: "0 0, 2.5px 2.5px",
          }}
        >
          <div className="relative bg-white rounded-[3px] px-5 pt-6 pb-6 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.35)]">
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 rotate-[-3deg] z-20 bg-[#9CB38D] shadow-[0_3px_6px_-1px_rgba(0,0,0,0.22),inset_0_0_10px_rgba(60,75,50,0.18)]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
                backgroundSize: "3px 3px, auto",
              }}
              aria-hidden="true"
            />
            {yosegaki.organizerImageUrl ? (
              <img
                src={yosegaki.organizerImageUrl}
                alt=""
                className="w-full rounded-sm object-cover max-h-64 ring-1 ring-black/[0.07]"
              />
            ) : (
              <div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center ring-1 ring-black/[0.07]">
                <span className="text-6xl">🎵</span>
              </div>
            )}
            <div className="pt-4 px-1 space-y-3 pb-3">
              <p className="text-lg font-bold text-gray-800 tracking-wide leading-snug">
                {yosegaki.organizerAudioTitle || "（タイトルなし）"}
              </p>
              {yosegaki.organizerAudioComment && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {yosegaki.organizerAudioComment}
                </p>
              )}
              {yosegaki.organizerAudioUrl && (
                <div className="rounded-2xl bg-transparent border border-[#1e50a2]/30 px-3 py-2.5">
                  <WaveformPlayer src={yosegaki.organizerAudioUrl} duration={30} />
                </div>
              )}
            </div>
            <p className="absolute bottom-3 right-4 text-[10px] text-gray-400">
              {yosegaki.organizerName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InvitedMemberList({ contributions }: { contributions: any[] }) {
  if (contributions.length === 0) return null;
  const participatedCount = contributions.filter((c: any) => c.audioUrl).length;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-gray-700">
        招待メンバー（{participatedCount}/{contributions.length}名 参加）
      </h3>
      <div className="space-y-2">
        {contributions.map((c: any) => {
          const hasAudio = !!c.audioUrl;
          const name = c.participantName || c.contributor?.displayName || c.contributor?.name;
          const email = c.contributor?.email;
          const avatarUrl = c.contributor?.avatarUrl;
          const displayName = name || (email ? email.replace(/(.{1}).+(@.+)/, "$1***$2") : "未登録ユーザー");
          return (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  displayName[0]?.toUpperCase() || "?"
                )}
              </div>
              <p className="flex-1 text-sm text-gray-700 truncate">{displayName}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                hasAudio ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
              }`}>
                {hasAudio ? "参加済" : "未参加"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyContribPolaroid({ contrib }: { contrib: any }) {
  const imageUrl = contrib.imageUrl || (Array.isArray(contrib.recording?.images) ? contrib.recording.images[0] : null);
  const audioUrl = contrib.audioUrl || contrib.recording?.audioUrl;
  const audioDuration = contrib.audioDuration || contrib.recording?.duration;
  const title = contrib.title || contrib.recording?.title || "（タイトルなし）";
  const message = contrib.message;
  const name = contrib.participantName || "参加者";

  return (
    <div
      className="relative bg-[#F3EBDD] rounded-2xl p-5 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
        backgroundSize: "5px 5px",
        backgroundPosition: "0 0, 2.5px 2.5px",
      }}
    >
      <div className="relative bg-white rounded-[3px] px-5 pt-6 pb-6 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.35)]">
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 rotate-[-3deg] z-20 bg-[#9CB38D] shadow-[0_3px_6px_-1px_rgba(0,0,0,0.22),inset_0_0_10px_rgba(60,75,50,0.18)]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
            backgroundSize: "3px 3px, auto",
          }}
          aria-hidden="true"
        />
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full rounded-sm object-cover max-h-64 ring-1 ring-black/[0.07]" />
        ) : (
          <div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center ring-1 ring-black/[0.07]">
            <span className="text-6xl">🎵</span>
          </div>
        )}
        <div className="pt-4 px-1 space-y-3 pb-3">
          <p className="text-lg font-bold text-gray-800 tracking-wide leading-snug">{title}</p>
          {message && <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p>}
          {audioUrl && (
            <div className="rounded-2xl bg-transparent border border-[#1e50a2]/30 px-3 py-2.5">
              <WaveformPlayer src={audioUrl} duration={audioDuration || 30} />
            </div>
          )}
        </div>
        <p className="absolute bottom-3 right-4 text-[10px] text-gray-400">{name}</p>
      </div>
    </div>
  );
}

function ContribModal({ contrib, onClose }: { contrib: any; onClose: () => void }) {
  const imageUrl = contrib.imageUrl || (Array.isArray(contrib.recording?.images) ? contrib.recording.images[0] : null);
  const audioUrl = contrib.audioUrl || contrib.recording?.audioUrl;
  const audioDuration = contrib.audioDuration || contrib.recording?.duration;
  const title = contrib.title || contrib.recording?.title || "（タイトルなし）";
  const name = contrib.participantName || "参加者";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center px-4 pb-28 sm:pb-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative bg-[#F3EBDD] rounded-2xl p-5 sm:p-7 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
            backgroundSize: "5px 5px",
            backgroundPosition: "0 0, 2.5px 2.5px",
          }}
        >
          {/* × 閉じるボタン */}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 transition-colors"
          >
            <X size={18} />
          </button>

          {/* ポラロイド本体 */}
          <div className="relative bg-white rounded-[3px] px-5 sm:px-6 pt-6 pb-6 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.35)]">
            {/* クラフト紙テープ */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 rotate-[-3deg] z-20 bg-[#9CB38D] shadow-[0_3px_6px_-1px_rgba(0,0,0,0.22),inset_0_0_10px_rgba(60,75,50,0.18)]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
                backgroundSize: "3px 3px, auto",
              }}
              aria-hidden="true"
            />

            {/* 写真 */}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full rounded-sm object-cover max-h-64 sm:max-h-72 ring-1 ring-black/[0.07]"
              />
            ) : (
              <div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center ring-1 ring-black/[0.07]">
                <span className="text-6xl">🎵</span>
              </div>
            )}

            <div className="pt-4 px-1 space-y-3 pb-3">
              <p className="text-lg font-bold text-gray-800 tracking-wide leading-snug pr-9">
                {title}
              </p>
              {contrib.message && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {contrib.message}
                </p>
              )}
              {audioUrl && (
                <div className="rounded-2xl bg-transparent border border-[#1e50a2]/30 px-3 py-2.5">
                  <WaveformPlayer src={audioUrl} duration={audioDuration || 30} />
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1">
                {contrib.isOrganizer && (
                  <img src="/icons/mizuhiki-bow.png" alt="" className="w-4 h-3 object-contain" aria-hidden />
                )}
                <p className="text-xs text-gray-500">{name}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
