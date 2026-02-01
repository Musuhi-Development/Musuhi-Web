"use client";

import { useState } from "react";
import { Mic, Pause, Square, Image as ImageIcon, MapPin, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

const emotionTags = ["嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "励まし", "疲れた", "悲しい", "イライラ"];

export default function RecordPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState("00:00");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("private");

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
    // Dummy timer logic would go here
  };

  return (
    <div className="pb-24 min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={() => router.back()} className="text-gray-500">キャンセル</button>
        <span className="font-bold">新規ジャーナル</span>
        <button className="text-orange-500 font-bold">保存</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Recording Visualizer Area */}
        <div className="h-48 bg-gray-50 flex items-center justify-center flex-col gap-4 border-b">
            <div className="flex items-center justify-center gap-1 h-12">
                {[...Array(10)].map((_, i) => (
                    <div 
                        key={i} 
                        className={clsx(
                            "w-1 rounded-full bg-orange-400 transition-all duration-300",
                            isRecording ? `h-${Math.floor(Math.random() * 8) + 4}` : "h-2"
                        )}
                        style={{ height: isRecording ? `${Math.random() * 30 + 10}px` : '4px' }}
                    ></div>
                ))}
            </div>
            <div className="text-3xl font-mono text-gray-700 tracking-wider">
                {time}
            </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-8 py-6">
            {!isRecording ? (
                <button 
                    onClick={handleRecordToggle}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                >
                    <Mic className="text-white" size={32} />
                </button>
            ) : (
                <>
                    <button 
                        onClick={() => setIsRecording(false)}
                        className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300"
                    >
                        <Pause size={24} />
                    </button>
                    <button 
                        onClick={() => setIsRecording(false)}
                        className="w-16 h-16 border-4 border-gray-200 rounded-full flex items-center justify-center overflow-hidden"
                    >
                        <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
                    </button>
                </>
            )}
        </div>

        {/* Metadata Form */}
        <div className="px-4 space-y-6">
            {/* Title */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">タイトル</label>
                <input 
                    type="text" 
                    placeholder="タイトルを入力..." 
                    className="w-full text-lg font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-orange-300 placeholder:text-gray-300"
                />
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">感情タグ</label>
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

            {/* Location & Media */}
            <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 w-1/2 justify-center">
                    <ImageIcon size={18} />
                    写真を追加
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 w-1/2 justify-center">
                    <MapPin size={18} />
                    位置情報ON
                </button>
            </div>

            {/* Visibility */}
            <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">公開範囲</label>
                <div className="relative">
                    <select 
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg focus:outline-none focus:bg-white focus:border-gray-500"
                    >
                        <option value="private">自分のみ (Closed)</option>
                        <option value="friends">知人のみ (Board Friend)</option>
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
