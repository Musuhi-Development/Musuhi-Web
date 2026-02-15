"use client";

import { useState } from "react";
import { Mic, Pause, Square, Image as ImageIcon, MapPin, ChevronDown, Camera, FolderOpen, Play } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

const emotionTags = ["嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "励まし", "疲れた", "悲しい", "イライラ"];
const MAX_RECORDING_SECONDS = 180; // 3分

export default function RecordPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState("00:00");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("private");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [memo, setMemo] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRecordToggle = () => {
    if (!isRecording && !hasRecording) {
      setIsRecording(true);
      setHasRecording(false);
    } else if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRecording(false);
    setHasRecording(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="pb-24 min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={() => router.back()} className="text-gray-500">キャンセル</button>
        <span className="font-bold">新規ジャーナル</span>
        <button className="text-orange-500 font-bold disabled:text-gray-300" disabled={!hasRecording}>保存</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Recording Visualizer Area */}
        <div className="h-48 bg-gray-50 flex items-center justify-center flex-col gap-4 border-b relative">
            <div className="flex items-center justify-center gap-1 h-12">
                {[...Array(10)].map((_, i) => (
                    <div 
                        key={i} 
                        className={clsx(
                            "w-1 rounded-full bg-orange-400 transition-all duration-300",
                            isRecording && !isPaused ? `h-${Math.floor(Math.random() * 8) + 4}` : "h-2"
                        )}
                        style={{ height: isRecording && !isPaused ? `${Math.random() * 30 + 10}px` : '4px' }}
                    ></div>
                ))}
            </div>
            <div className="text-3xl font-mono text-gray-700 tracking-wider">
                {time}
            </div>
            <div className="text-xs text-gray-400">
              最大 {formatTime(MAX_RECORDING_SECONDS)}
            </div>
            {recordedSeconds >= MAX_RECORDING_SECONDS && (
              <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                最大時間に達しました
              </div>
            )}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-8 py-6">
            {!isRecording && !hasRecording ? (
                <button 
                    onClick={handleRecordToggle}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                >
                    <Mic className="text-white" size={32} />
                </button>
            ) : isRecording ? (
                <>
                    <button 
                        onClick={handlePause}
                        className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300"
                    >
                        <Pause size={24} />
                    </button>
                    <button 
                        onClick={handleStop}
                        className="w-16 h-16 border-4 border-gray-200 rounded-full flex items-center justify-center overflow-hidden hover:border-gray-300"
                    >
                        <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
                    </button>
                </>
            ) : (
                // プレビュー再生ボタン
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => {/* プレビュー再生 */}}
                    className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600"
                  >
                    <Play className="text-white ml-1" size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      setHasRecording(false);
                      setTime("00:00");
                      setRecordedSeconds(0);
                    }}
                    className="text-sm text-red-500 font-medium"
                  >
                    録り直す
                  </button>
                </div>
            )}
        </div>

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
                    className="w-full text-lg font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-orange-300 placeholder:text-gray-300"
                />
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">
                  感情タグ <span className="text-red-500">※</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {emotionTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                                selectedTags.includes(tag) 
                                    ? "bg-orange-100 border-orange-200 text-orange-700" 
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                    <button className="px-3 py-1.5 rounded-full text-sm border border-dashed border-gray-300 text-gray-400">
                        + 追加
                    </button>
                </div>
            </div>

            {/* テキストメモ */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">テキストメモ</label>
                <textarea 
                    placeholder="メモを入力（任意）"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500 placeholder:text-gray-400 resize-none"
                />
            </div>

            {/* Location & Media */}
            <div className="space-y-3">
                {/* 写真を追加 */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">写真を追加</label>
                  {!showImageOptions ? (
                    <button 
                      onClick={() => setShowImageOptions(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 w-full justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ImageIcon size={18} />
                      写真を追加
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {/* ライブラリから選択 */}}
                        className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <FolderOpen size={20} />
                        <span className="text-xs">ライブラリから</span>
                      </button>
                      <button 
                        onClick={() => {/* カメラで撮影 */}}
                        className="flex flex-col items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg text-sm text-green-600 hover:bg-green-100 transition-colors"
                      >
                        <Camera size={20} />
                        <span className="text-xs">カメラで撮影</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 位置情報 */}
                <button className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 w-full justify-center hover:bg-gray-200 transition-colors">
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
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500"
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
