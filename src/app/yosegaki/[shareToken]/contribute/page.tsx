"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ImageIcon, Mic, Square } from "lucide-react";
import Link from "next/link";

export default function ContributePage() {
  const { shareToken } = useParams() as { shareToken: string };
  const router = useRouter();

  const [yosegaki, setYosegaki] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // フォーム
  const [participantName, setParticipantName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 録音
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/yosegaki/share/${shareToken}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setYosegaki(d.yosegaki); })
      .finally(() => setLoading(false));
  }, [shareToken]);

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
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "画像のアップロードに失敗しました");
      }
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
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            setAudioUrl(data.url || "");
          }
        } catch (e) {
          console.error(e);
        }
      };

      mr.start();
      setMediaRecorder(mr);
      setIsRecording(true);
      setRecordingSeconds(0);

      const timer = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 29) {
            mr.stop();
            clearInterval(timer);
            setIsRecording(false);
          }
          return s + 1;
        });
      }, 1000);
      setTimerRef(timer);
    } catch {
      setError("マイクへのアクセスが拒否されました");
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioDuration(recordingSeconds);
      if (timerRef) clearInterval(timerRef);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!participantName.trim()) { setError("参加者名を入力してください"); return; }
    if (!imageUrl) { setError("写真を選択してください"); return; }
    if (!audioUrl) { setError("音声を録音してください"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/yosegaki/${yosegaki.id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: participantName.trim(),
          imageUrl: imageUrl || null,
          audioUrl,
          audioDuration: audioDuration || recordingSeconds,
          title: title.trim() || null,
          message: message.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "投稿に失敗しました");
      }
      router.push(`/yosegaki/${shareToken}/done?name=${encodeURIComponent(yosegaki.recipientName)}`);
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
  if (notFound || !yosegaki) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
        <p className="text-gray-500 mb-4">このページは見つかりません</p>
        <Link href="/" className="text-[#2A5CAA] text-sm">トップへ戻る</Link>
      </div>
    );
  }
  if (yosegaki.status !== "collecting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
        <p className="text-gray-500 mb-2">現在参加を受け付けていません</p>
        <Link href={`/yosegaki/${shareToken}`} className="text-[#2A5CAA] text-sm">表紙に戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <header className="bg-gradient-to-b from-[#2A5CAA] to-[#4A7BC8] px-5 pt-8 pb-6 text-white">
        <Link href={`/yosegaki/${shareToken}`} className="text-xs opacity-80 mb-2 block">← 表紙に戻る</Link>
        <h1 className="text-lg font-bold">声の寄せ書きに参加する</h1>
        <p className="text-sm opacity-80 mt-0.5">{yosegaki.recipientName}へのメッセージを録音してください</p>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-5 max-w-md mx-auto">

        {/* 参加者名 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            参加者名 <span className="text-red-500">※</span>
          </label>
          <input
            type="text"
            placeholder="例: 山田 花子"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm"
            required
          />
        </div>

        {/* 写真 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            写真 <span className="text-red-500">※</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 bg-white border-2 border-dashed border-gray-300 rounded-2xl py-8 text-gray-400 hover:border-[#2A5CAA] hover:text-[#2A5CAA] transition-colors"
            >
              <ImageIcon size={28} />
              <span className="text-sm">ライブラリから写真を選ぶ</span>
              <span className="text-[10px]">JPEG・PNG・WebP・GIF（5MB以内）</span>
            </button>
          ) : (
            <div className="relative">
              {imageUploading && (
                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square max-h-60">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => { setImagePreview(""); setImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="mt-2 text-xs text-gray-400 underline block"
              >
                写真を選び直す
              </button>
            </div>
          )}
        </div>

        {/* タイトル */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            タイトル（20文字以内）
          </label>
          <input
            type="text"
            placeholder="例: いつもありがとう"
            maxLength={20}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm"
          />
          <p className="text-[10px] text-gray-400 text-right mt-0.5">{title.length}/20</p>
        </div>

        {/* コメント */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            コメント（140文字以内）
          </label>
          <textarea
            placeholder="メッセージを入力してください"
            maxLength={140}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm resize-none"
          />
          <p className="text-[10px] text-gray-400 text-right">{message.length}/140</p>
        </div>

        {/* 音声録音 */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 block">
            音声メッセージ（30秒以内）<span className="text-red-500"> ※</span>
          </label>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3">
            {!isRecording && !audioUrl && (
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center shadow-md"
              >
                <Mic className="text-white" size={28} />
              </button>
            )}
            {isRecording && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm font-bold text-red-600">録音中... {recordingSeconds}秒</p>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-md"
                >
                  <Square className="text-white" size={24} fill="white" />
                </button>
              </>
            )}
            {audioUrl && !isRecording && (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <p className="text-sm font-bold">録音完了 ({audioDuration}秒)</p>
                </div>
                <audio src={audioUrl} controls className="w-full" />
                <button
                  type="button"
                  onClick={() => { setAudioUrl(""); setAudioDuration(0); }}
                  className="text-xs text-gray-400 underline"
                >
                  録り直す
                </button>
              </>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !participantName.trim() || !imageUrl || imageUploading || !audioUrl}
          className="w-full bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold py-4 rounded-full shadow-lg text-sm disabled:opacity-50"
        >
          {submitting ? "送信中…" : "声を贈る 🎁"}
        </button>
      </form>

      {/* Powered by Musuhi */}
      <div className="text-center py-6 space-y-2 px-5">
        <p className="text-xs text-gray-400">Powered by Musuhi</p>
        <p className="text-xs text-gray-500">あなたも大切な人へ『声の贈りもの』を届けませんか？</p>
        <Link
          href="/signup"
          className="inline-block px-6 py-2 bg-[#2A5CAA] text-white text-xs font-bold rounded-full"
        >
          Musuhiをはじめる
        </Link>
      </div>
    </div>
  );
}
