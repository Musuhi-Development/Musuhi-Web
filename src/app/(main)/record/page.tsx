"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, MapPin, ChevronDown, Camera, FolderOpen, Loader2, X } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import VoiceRecorder from "@/components/VoiceRecorder";

const emotionTags = ["嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "励まし", "疲れた", "悲しい", "イライラ"];
const MAX_RECORDING_SECONDS = 180; // 3分

type JournalingPrompt = {
  headline: string;
  message: string;
  recordingText: string;
};

export default function RecordPage() {
  const router = useRouter();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("private");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState<JournalingPrompt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/journaling/prompt", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch journaling prompt");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setPrompt({
          headline: data.headline || "AIからの提案",
          message: data.message || "こんなことを録音してみませんか？",
          recordingText: data.recordingText || "今日いちばん心に残ったこと",
        });
      })
      .catch((error) => {
        console.error("Failed to load journaling prompt:", error);
        if (!isMounted) return;
        setPrompt({
          headline: "AIからの提案",
          message: "今日はどんな気持ちで過ごしたか、短く残してみませんか？",
          recordingText: "今日いちばん心に残ったこと",
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRecordingComplete = (blob: Blob, recordedDuration: number) => {
    setAudioBlob(blob);
    setDuration(recordedDuration);
  };

  const handleImageUpload = async (file: File) => {
    if (uploadedImages.length >= 5) {
      alert("画像は最大5枚まで追加できます");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("画像のアップロードに失敗しました");
      }

      const { url } = await uploadRes.json();
      setUploadedImages((prev) => [...prev, url]);
      setShowImageOptions(false);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(error instanceof Error ? error.message : "画像のアップロードに失敗しました");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!audioBlob || !title.trim()) {
      alert("タイトルと音声録音は必須です");
      return;
    }

    setSaving(true);

    try {
      // 1. 音声ファイルをアップロード
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("音声のアップロードに失敗しました");
      }

      const { url: audioUrl } = await uploadRes.json();

      // 2. 録音データをDBに保存
      const recordingData = {
        title: title.trim(),
        description: memo.trim() || null,
        audioUrl,
        duration,
        emotions: selectedTags,
        visibility,
        location: null, // TODO: 位置情報実装
      };

      const createRes = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordingData),
      });

      if (!createRes.ok) {
        throw new Error("録音の保存に失敗しました");
      }

      // 成功したらホームページへ
      router.push("/home");
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={() => router.back()} className="text-gray-500" disabled={saving}>
          キャンセル
        </button>
        <span className="font-bold">新規ジャーナル</span>
        <button 
          onClick={handleSave}
          disabled={!audioBlob || !title.trim() || saving}
          className="text-orange-500 font-bold disabled:text-gray-300 flex items-center gap-1"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              保存中...
            </>
          ) : (
            "保存"
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {prompt && (
          <div className="px-4 pt-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-[11px] font-bold text-[#2A5CAA]">{prompt.headline || "AIからの提案"}</p>
              <p className="text-xs text-gray-700 mt-1">{prompt.message}</p>
              <p className="text-xs text-gray-600 mt-1">「{prompt.recordingText}」</p>
            </div>
          </div>
        )}

        {/* Recording Component */}
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDuration={MAX_RECORDING_SECONDS}
          className="mb-6"
        />

        {/* Metadata Form */}
        <div className="px-4 space-y-6">
            {/* Title */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">
                  タイトル <span className="text-red-500">※</span>
                </label>
                <input 
                    type="text" 
                    placeholder="タイトルを入力..." 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-lg font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-orange-300 placeholder:text-gray-300"
                    disabled={saving}
                />
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">
                  感情タグ
                </label>
                <div className="flex flex-wrap gap-2">
                    {emotionTags.map(tag => (
                        <button 
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            disabled={saving}
                            className={clsx(
                                "px-3 py-1.5 text-sm rounded-full border-2 transition-colors",
                                selectedTags.includes(tag) 
                                    ? "bg-orange-100 border-orange-400 text-orange-700 font-medium" 
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Memo */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">テキストメモ</label>
                <textarea 
                    placeholder="メモを入力（任意）"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    disabled={saving}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400 resize-none"
                />
            </div>

            {/* Location & Media */}
            <div className="space-y-3">
                {/* 写真を追加 */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">
                    写真を追加（最大5枚）
                  </label>
                  
                  {/* 画像プレビュー */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            disabled={saving}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {uploadedImages.length < 5 && (
                    <>
                      {!showImageOptions ? (
                        <button 
                          onClick={() => setShowImageOptions(true)}
                          disabled={saving || uploadingImage}
                          className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 w-full justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              アップロード中...
                            </>
                          ) : (
                            <>
                              <ImageIcon size={18} />
                              写真を追加
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={saving || uploadingImage}
                              className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <FolderOpen size={20} />
                              <span className="text-xs">ライブラリから</span>
                            </button>
                            <button 
                              onClick={() => {
                                // モバイルでカメラを起動する場合は capture="environment" を使う
                                fileInputRef.current?.click();
                              }}
                              disabled={saving || uploadingImage}
                              className="flex flex-col items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg text-sm text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              <Camera size={20} />
                              <span className="text-xs">カメラで撮影</span>
                            </button>
                          </div>
                          <button
                            onClick={() => setShowImageOptions(false)}
                            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700"
                          >
                            キャンセル
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                {/* 位置情報 */}
                <button 
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 w-full justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <MapPin size={18} />
                    位置情報ON
                </button>
            </div>

            {/* Visibility */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">
                  公開範囲 <span className="text-red-500">※</span>
                </label>
                <div className="relative">
                    <select 
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        disabled={saving}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 disabled:opacity-50"
                    >
                        <option value="private">自分のみ (Closed)</option>
                        <option value="friends">家族・友人/知人のみ (Board Friend)</option>
                        <option value="public">全体公開 (Board Public)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>
            
        </div>
      </div>
    </div>
  );
}
