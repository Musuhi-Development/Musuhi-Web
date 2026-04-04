"use client";

import { useState, useRef, Fragment, useEffect } from "react";
import { X, Image as ImageIcon, MapPin, ChevronDown, Camera, FolderOpen, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Dialog, Transition } from "@headlessui/react";
import { ScreenOverlay } from "@/components/ui/Overlay";

const emotionTags = ["嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "励まし", "疲れた", "悲しい", "イライラ"];
const MAX_RECORDING_SECONDS = 180; // 3分

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "recording" | "voice-comment";
  onSubmitVoiceComment?: (payload: { audioBlob: Blob; duration: number }) => Promise<void>;
}

export default function RecordingModal({
  isOpen,
  onClose,
  variant = "recording",
  onSubmitVoiceComment,
}: RecordingModalProps) {
  const router = useRouter();
  const isVoiceCommentMode = variant === "voice-comment";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setAudioBlob(null);
      setDuration(0);
      setTitle("");
      setSelectedTags([]);
      setVisibility("private");
      setShowImageOptions(false);
      setUploadedImages([]);
      setUploadingImage(false);
      setMemo("");
      setSaving(false);
    }
  }, [isOpen]);

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
    if (!audioBlob) {
      alert("音声録音は必須です");
      return;
    }

    if (!isVoiceCommentMode && !title.trim()) {
      alert("タイトルと音声録音は必須です");
      return;
    }

    setSaving(true);

    try {
      if (isVoiceCommentMode) {
        if (!onSubmitVoiceComment) {
          throw new Error("ボイスコメント投稿処理が設定されていません");
        }

        await onSubmitVoiceComment({
          audioBlob,
          duration,
        });
        onClose();
        return;
      }

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
        images: uploadedImages,
        visibility,
        location: null,
      };

      const createRes = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordingData),
      });

      if (!createRes.ok) {
        throw new Error("録音の保存に失敗しました");
      }

      // 成功したらモーダルを閉じてホームページへ
      onClose();
      router.push("/home");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ScreenOverlay />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                  <h2 className="text-lg font-bold text-gray-800">
                    {isVoiceCommentMode ? "ボイスコメント" : "新規ジャーナル"}
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={!audioBlob || (!isVoiceCommentMode && !title.trim()) || saving}
                    className="text-[#2A5CAA] font-bold disabled:text-gray-300 flex items-center gap-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {isVoiceCommentMode ? "投稿中" : "保存中"}
                      </>
                    ) : (
                      isVoiceCommentMode ? "投稿" : "保存"
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(100vh-200px)] px-6 py-4">
                  {/* Recording Component */}
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    maxDuration={isVoiceCommentMode ? 60 : MAX_RECORDING_SECONDS}
                    className="mb-6"
                  />

                  {!isVoiceCommentMode && (
                    <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">
                        タイトル <span className="text-red-500">※</span>
                      </label>
                      <input
                        type="text"
                        placeholder="タイトルを入力..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-base font-semibold border-b-2 border-gray-200 py-2 focus:outline-none focus:border-[#2A5CAA] placeholder:text-gray-300"
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
                              "px-3 py-1.5 text-sm rounded-full transition-all",
                              selectedTags.includes(tag)
                                ? "bg-[#2A5CAA] text-white shadow-md"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Memo */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">テキストメモ</label>
                      <textarea
                        placeholder="メモを入力（任意）"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={3}
                        disabled={saving}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-2xl focus:outline-none focus:bg-white focus:border-teal-300 placeholder:text-gray-400 resize-none"
                      />
                    </div>

                    {/* Images */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
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
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving || uploadingImage}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-2xl text-sm text-gray-600 w-full justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            アップロード中...
                          </>
                        ) : (
                          <>
                            <ImageIcon size={18} />
                            写真を追加 ({uploadedImages.length}/5)
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

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
                          className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-2xl focus:outline-none focus:bg-white focus:border-teal-300 disabled:opacity-50"
                        >
                          <option value="private">自分のみ</option>
                          <option value="friends">家族・友人/知人のみ</option>
                          <option value="public">全体公開</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
