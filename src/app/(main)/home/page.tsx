"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Grid3x3, List, MapPin, Lock, Globe, Users, Volume2, Play, Pause } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { ScreenOverlay } from "@/components/ui/Overlay";

// AIが推定する動物アイコン（デモ用の絵文字マッピング）
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

const emotionTags = ["全て", "嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "励まし", "疲れた", "悲しい", "イライラ"];

export default function HomePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedTag, setSelectedTag] = useState("全て");
  const [recordings, setRecordings] = useState<any[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchUser();
    fetchRecordings();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }

  async function fetchRecordings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recordings");
      
      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch recordings");
      }

      const data = await response.json();
      setRecordings(data.recordings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit" 
    });
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Audio playback functions
  function togglePlayPause(recording: any, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!recording.audioUrl) {
      alert("音声ファイルが見つかりません");
      return;
    }

    // If clicking the same recording that's playing, pause it
    if (playingId === recording.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // If clicking a different recording, or the same one that was paused
    if (playingId !== recording.id) {
      // Stop previous audio if any
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(recording.audioUrl);
      audioRef.current = audio;
      setPlayingId(recording.id);

      // Set up event listeners
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
      // Resume paused audio
      audioRef.current?.play();
      setIsPlaying(true);
    }
  }

  const filteredRecordings = useMemo(() => {
    if (selectedTag === "全て") return recordings;
    return recordings.filter((recording) => Array.isArray(recording.emotions) && recording.emotions.includes(selectedTag));
  }, [recordings, selectedTag]);

  function getVisibilityLabel(visibility: string) {
    if (visibility === "private") return "非公開";
    if (visibility === "friends") return "限定公開";
    if (visibility === "public") return "公開";
    return "非公開";
  }

  function getVisibilityIcon(visibility: string) {
    if (visibility === "private") return <Lock size={12} />;
    if (visibility === "friends") return <Users size={12} />;
    return <Globe size={12} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Home</h1>
          <button 
            onClick={() => router.push('/mypage')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A7BC8] to-[#2A5CAA] flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-all overflow-hidden"
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

      {/* Main Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Recordings Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedTag === "全て" ? "All Recordings" : selectedTag}
            </h3>
            <button 
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="text-[#2A5CAA] hover:text-[#1F4580] transition-colors"
            >
              {viewMode === "list" ? (
                <Grid3x3 size={20} />
              ) : (
                <List size={20} />
              )}
            </button>
          </div>

          {/* Emotion Filter Tags */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
            {emotionTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={clsx(
                  "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors font-medium",
                  selectedTag === tag 
                    ? "bg-[#2A5CAA] text-white shadow-sm" 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={fetchRecordings}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                再試行
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredRecordings.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl shadow-md">
              <div className="text-6xl mb-4">🎙️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {selectedTag === "全て" ? "まだ録音がありません" : "この感情タグの録音がありません"}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedTag === "全て" ? "右下のボタンから録音を開始しましょう！" : "他の感情タグもお試しください"}
              </p>
            </div>
          )}

          {/* Recordings List/Grid */}
          {!loading && !error && filteredRecordings.length > 0 && (
            <div className={clsx(
              viewMode === "grid" 
                ? "grid grid-cols-2 gap-3"
                : "space-y-3"
            )}>
              {filteredRecordings.map((recording: any) => {
                const imageUrl = Array.isArray(recording.images) ? recording.images[0] : null;
                const animalIcon = recording.emotions && recording.emotions.length > 0 
                  ? emotionToAnimal[recording.emotions[0]] || "🎵"
                  : "🎵";

                return (
                  <div
                    key={recording.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRecording(recording)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedRecording(recording);
                      }
                    }}
                    className={clsx(
                      "w-full text-left block bg-white rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2A5CAA]/30",
                      viewMode === "grid" ? "p-3" : "p-4"
                    )}
                  >
                    {viewMode === "list" ? (
                      // List View
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={recording.title}
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                              <span className="text-3xl">{animalIcon}</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-400 flex items-center gap-1 text-[10px] mb-1">
                            {getVisibilityIcon(recording.visibility)}
                            <span>{getVisibilityLabel(recording.visibility)}</span>
                          </div>
                          <h4 className="font-semibold text-gray-800 truncate">{recording.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(recording.createdAt)} · {formatDuration(recording.duration)}
                          </p>
                          {recording.emotions && recording.emotions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recording.emotions.slice(0, 3).map((e: string) => (
                                <span key={e} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-[#2A5CAA] rounded-md">
                                  #{e}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => togglePlayPause(recording, e)}
                          className={clsx(
                            "w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-[#2A5CAA] hover:bg-gray-50 transition-colors",
                            playingId === recording.id && isPlaying && "bg-[#2A5CAA] text-white border-[#2A5CAA]"
                          )}
                          aria-label={playingId === recording.id && isPlaying ? "一時停止" : "再生"}
                        >
                          {playingId === recording.id && isPlaying ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={18} fill="currentColor" />
                          )}
                        </button>
                      </div>
                    ) : (
                      // Grid View
                      <div>
                        {/* Thumbnail */}
                        <div className="w-full aspect-square mb-3">
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
                        </div>

                        {/* Info */}
                        <div className="text-gray-400 flex items-center gap-1 text-[10px] mb-1">
                          {getVisibilityIcon(recording.visibility)}
                          <span>{getVisibilityLabel(recording.visibility)}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm truncate mb-1">
                          {recording.title}
                        </h4>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500">{formatDate(recording.createdAt)}</p>
                          <button
                            onClick={(e) => togglePlayPause(recording, e)}
                            className={clsx(
                              "w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-[#2A5CAA] hover:bg-gray-50 transition-colors",
                              playingId === recording.id && isPlaying && "bg-[#2A5CAA] text-white border-[#2A5CAA]"
                            )}
                            aria-label={playingId === recording.id && isPlaying ? "一時停止" : "再生"}
                          >
                            {playingId === recording.id && isPlaying ? (
                              <Pause size={16} fill="currentColor" />
                            ) : (
                              <Play size={16} fill="currentColor" />
                            )}
                          </button>
                        </div>
                        {recording.emotions && recording.emotions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {recording.emotions.slice(0, 2).map((e: string) => (
                              <span key={e} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-[#2A5CAA] rounded-md">
                                #{e}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedRecording && (
        <ScreenOverlay className="z-[70] flex items-end sm:items-center justify-center px-4 pb-28 sm:pb-4" onClick={() => setSelectedRecording(null)}>
          <div
            className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative bg-[#fffdf8] rounded-2xl p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.25)] border border-[#f1eadb]">
              <div className="absolute top-2 left-6 w-16 h-5 rounded-sm bg-[#f6e7a8]/80 rotate-[-6deg] shadow-sm" />
              <div className="absolute top-2 right-8 w-16 h-5 rounded-sm bg-[#d9e8ff]/80 rotate-[8deg] shadow-sm" />

              <div className="relative bg-white p-3 sm:p-4 rounded-md border border-[#eee6d6] shadow-[0_10px_22px_rgba(0,0,0,0.12)]">
                {Array.isArray(selectedRecording.images) && selectedRecording.images.length > 0 ? (
                  <img
                    src={selectedRecording.images[0]}
                    alt={selectedRecording.title}
                    className="w-full rounded-sm object-cover max-h-64 sm:max-h-72"
                  />
                ) : (
                  <div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                    <span className="text-6xl">
                      {selectedRecording.emotions && selectedRecording.emotions.length > 0
                        ? emotionToAnimal[selectedRecording.emotions[0]] || "🎵"
                        : "🎵"}
                    </span>
                  </div>
                )}

                <div className="pt-4 pb-2 px-1">
                  <p className="text-lg text-gray-800 tracking-wide font-semibold">{selectedRecording.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(selectedRecording.createdAt)} ・ {formatDuration(selectedRecording.duration)}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    {getVisibilityIcon(selectedRecording.visibility)}
                    <span>{getVisibilityLabel(selectedRecording.visibility)}</span>
                    {selectedRecording.location && (
                      <>
                        <span>・</span>
                        <MapPin size={12} />
                        <span>{selectedRecording.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedRecording.audioUrl && (
                <div className="mt-4 px-1">
                  <p className="text-xs font-semibold text-gray-500 mb-2">再生</p>
                  <audio controls src={selectedRecording.audioUrl} className="w-full" preload="metadata" />
                </div>
              )}

              {selectedRecording.emotions && selectedRecording.emotions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedRecording.emotions.map((emotion: string) => (
                    <span key={emotion} className="text-xs px-2 py-1 bg-blue-50 text-[#2A5CAA] rounded-full">
                      #{emotion}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 px-1">
                <p className="text-xs font-semibold text-gray-500 mb-2">テキストメモ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedRecording.description || "メモは設定されていません"}
                </p>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </ScreenOverlay>
      )}
    </div>
  );
}
