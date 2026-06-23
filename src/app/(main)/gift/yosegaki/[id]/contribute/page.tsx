"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ImageIcon, Mic, Square, X, ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { WaveformPlayer } from "@/components/WaveformPlayer";

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function YosegakiContributePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useUser();

  const [yosegaki, setYosegaki] = useState<any>(null);
  const [existingContrib, setExistingContrib] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [participantName, setParticipantName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/yosegaki/${id}`);
        if (!res.ok) { router.replace("/gift"); return; }
        const data = await res.json();
        const y = data.yosegaki;
        setYosegaki(y);

        if (user) {
          setParticipantName(user.displayName || user.name || "");
          const mine = (y.contributions || []).find((c: any) => c.contributorId === user.id);
          if (mine && mine.audioUrl) {
            setExistingContrib(mine);
            setParticipantName(mine.participantName || user.displayName || user.name || "");
            setImageUrl(mine.imageUrl || "");
            setImagePreview(mine.imageUrl || "");
            setTitle(mine.title || "");
            setMessage(mine.message || "");
            setAudioUrl(mine.audioUrl || "");
            setAudioDuration(mine.audioDuration || 0);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    if (id && user !== undefined) load();
  }, [id, user]);

  const isDeadlinePassed = yosegaki?.deadline ? new Date() > new Date(yosegaki.deadline) : false;

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/public", { method: "POST", body: formData });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "画像のアップロードに失敗しました"); }
      const data = await res.json();
      setImageUrl(data.url);
    } catch (e: any) {
      setError(e.message);
      setImagePreview("");
      setImageUrl("");
    } finally {
      setImageUploading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        try {
          const res = await fetch("/api/upload/public-audio", { method: "POST", body: formData });
          if (res.ok) { const data = await res.json(); setAudioUrl(data.url || ""); }
          else { const d = await res.json(); setError(d.error || "音声のアップロードに失敗しました"); }
        } catch { setError("音声のアップロードに失敗しました"); }
      };
      mr.start(100);
      setMediaRecorder(mr);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 29) {
            mr.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(false);
            setAudioDuration(30);
          }
          return s + 1;
        });
      }, 1000);
    } catch { setError("マイクへのアクセスが拒否されました"); }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioDuration(recordingSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  const isFormComplete =
    participantName.trim() !== "" &&
    imageUrl !== "" &&
    !imageUploading &&
    title.trim() !== "" &&
    message.trim() !== "" &&
    audioUrl !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormComplete || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const method = existingContrib ? "PATCH" : "POST";
      const body = existingContrib
        ? JSON.stringify({
            contributionId: existingContrib.id,
            participantName: participantName.trim(),
            imageUrl,
            audioUrl,
            audioDuration: audioDuration || recordingSeconds,
            title: title.trim(),
            message: message.trim(),
          })
        : JSON.stringify({
            participantName: participantName.trim(),
            imageUrl,
            audioUrl,
            audioDuration: audioDuration || recordingSeconds,
            title: title.trim(),
            message: message.trim(),
          });
      const res = await fetch(`/api/yosegaki/${id}/contributions`, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "投稿に失敗しました");
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!yosegaki) return null;

  // 参加完了画面
  if (done) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-5 text-center gap-8 pb-20">
        <div className="text-6xl">🎙️</div>
        <div className="space-y-3">
          <h1 className="text-lg font-bold text-gray-800 leading-snug">
            あなたの声が、みんなで届けるボイスギフト（寄せ音声）に加わりました。
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {yosegaki.recipientName}さんへの想いを届けていただき、ありがとうございます
          </p>
        </div>
        <button
          onClick={() => router.push(`/gift/yosegaki/${id}`)}
          className="w-full max-w-sm bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold py-4 rounded-full shadow-md text-sm"
        >
          寄せ音声の画面に戻る
        </button>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-5 text-center gap-6">
        <div className="text-5xl">⏰</div>
        <p className="text-base font-bold text-gray-800">この声の寄せ書きは募集期限を過ぎています</p>
        <button onClick={() => router.back()} className="text-[#2A5CAA] text-sm">戻る</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">
            {existingContrib ? "投稿を編集する" : "声の寄せ書きに参加する"}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{yosegaki.recipientName}へのメッセージ</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6 max-w-md mx-auto">

        {/* ボイスギフトに表示される名前 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            ボイスギフトに表示される名前 <span className="text-red-500">※</span>
          </label>
          <p className="text-[11px] text-gray-400 mb-2">
            贈る相手との関係性に合わせて自由に変更できます
          </p>
          <input
            type="text"
            placeholder="例: 田中 / たなちゃん / 同期の田中"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm"
            required
          />
        </div>

        {/* 写真（必須） */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            写真 <span className="text-red-500">※</span>
          </label>
          <p className="text-[11px] text-gray-400 mb-2">
            思い出の写真・イラスト・アバター画像などをアップロードしてください
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="プレビュー"
                className="w-full max-h-48 object-cover rounded-xl ring-1 ring-black/10"
              />
              <button
                type="button"
                onClick={() => { setImageUrl(""); setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#2A5CAA] hover:text-[#2A5CAA] transition-colors disabled:opacity-50"
            >
              <ImageIcon size={24} />
              <span className="text-xs font-medium">{imageUploading ? "アップロード中…" : "写真を選択"}</span>
            </button>
          )}
        </div>

        {/* 音声録音（必須） */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            音声メッセージ（最大30秒） <span className="text-red-500">※</span>
          </label>
          {audioUrl ? (
            <div className="space-y-2">
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <WaveformPlayer src={audioUrl} duration={audioDuration} />
              </div>
              <button
                type="button"
                onClick={() => { setAudioUrl(""); setAudioDuration(0); setRecordingSeconds(0); }}
                className="text-xs text-gray-500 underline"
              >
                録音し直す
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-bold">録音中… {pad(Math.floor(recordingSeconds / 60))}:{pad(recordingSeconds % 60)} / 0:30</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg"
                  >
                    <Square size={22} />
                  </button>
                  <p className="text-[11px] text-gray-400">ボタンを押すと停止します（30秒で自動停止）</p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-14 h-14 rounded-full bg-[#2A5CAA] flex items-center justify-center text-white shadow-lg hover:bg-[#4A7BC8]"
                  >
                    <Mic size={22} />
                  </button>
                  <p className="text-xs text-gray-500">マイクボタンをタップして録音開始</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* タイトル（必須） */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-bold text-gray-500">
              タイトル <span className="text-red-500">※</span>
            </label>
            <span className="text-[10px] text-gray-400">{title.length}/30</span>
          </div>
          <input
            type="text"
            placeholder="例:「いつもありがとう」"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
            maxLength={30}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm"
            required
          />
        </div>

        {/* コメント（必須・140字） */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-xs font-bold text-gray-500">
              コメント <span className="text-red-500">※</span>
            </label>
            <span className={`text-[10px] ${message.length > 130 ? "text-orange-500" : "text-gray-400"}`}>
              {message.length}/140
            </span>
          </div>
          <textarea
            placeholder="一言メッセージを書いてください"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 140))}
            maxLength={140}
            rows={4}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm resize-none"
            required
          />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={!isFormComplete || submitting}
          className="w-full bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold py-4 rounded-full shadow-md text-sm disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? "送信中…" : existingContrib ? "更新する" : "この声を届ける"}
        </button>
      </form>
    </div>
  );
}
