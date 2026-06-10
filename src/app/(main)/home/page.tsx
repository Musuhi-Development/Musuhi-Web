"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Grid3x3, List, Lock, Globe, Users, Volume2, Play, Pause, X } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { ScreenOverlay } from "@/components/ui/Overlay";
import { WaveformPlayer } from "@/components/WaveformPlayer";

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

const emotionTags = ["全て", "嬉しい", "感謝", "楽しい", "幸せ", "ワクワク", "応援", "疲れた", "悲しい", "イライラ"];



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
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  const todayDominantEmotion = useMemo(() => {
    const todayEmotions = recordings
      .filter((r: any) => new Date(r.createdAt).toDateString() === new Date().toDateString())
      .flatMap((r: any) => r.emotions || []);
    if (todayEmotions.length === 0) return null;
    return todayEmotions.reduce((a: string, b: string, _i: number, arr: string[]) =>
      arr.filter((v: string) => v === a).length >= arr.filter((v: string) => v === b).length ? a : b
    );
  }, [recordings]);

  const uniqueRecordingDays = useMemo(() => {
    return new Set(recordings.map((r: any) => new Date(r.createdAt).toDateString())).size;
  }, [recordings]);

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
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1e50a2]">Voice Album</h1>
          </div>
          <button
            onClick={() => router.push('/mypage')}
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

      {/* Main Content */}
      <div className="px-6 py-6 space-y-6">

        {/* Analysis Card */}
        {!loading && (
          <div className="rounded-3xl overflow-hidden shadow-md">
            {/* 上段: 今日の振り返り */}
            <div className="bg-gradient-to-br from-amber-50 to-rose-50 px-5 pt-4 pb-4">
              <p className="text-xs font-bold text-amber-700 mb-3 tracking-wide">今日の振り返り</p>
              {todayDominantEmotion ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex-shrink-0">
                    {emotionToAnimal[todayDominantEmotion] ? (
                      <img
                        src={emotionToAnimal[todayDominantEmotion]}
                        alt={todayDominantEmotion}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-4xl">🎵</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800 mb-0.5">{todayDominantEmotion}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      今日は{todayDominantEmotion}の気持ちを感じる一日でしたね。周りの人との繋がりを大切にしている様子が伺えます。
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed">
                  今日の記録がまだありません。<br />今日の気持ちを声で残してみましょう。
                </p>
              )}
            </div>
            {/* 下段: あなたの歩み */}
            <div className="bg-white px-5 py-4">
              <p className="text-xs font-bold text-[#2A5CAA] mb-3 tracking-wide">あなたの歩み</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-blue-50 rounded-2xl py-3">
                  <p className="text-2xl font-bold text-gray-800">{recordings.length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">ジャーナル総数</p>
                </div>
                <div className="text-center bg-blue-50 rounded-2xl py-3">
                  <p className="text-2xl font-bold text-gray-800">{uniqueRecordingDays}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">記録した日数</p>
                </div>
                <div className="text-center bg-blue-50 rounded-2xl py-3">
                  <p className="text-2xl font-bold text-gray-800">{user?._count?.sentGifts ?? 0}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">贈ったギフト</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recordings Section */}
        <div>
          <div className="flex justify-end mb-3">
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
          <div className="flex flex-wrap gap-2 mb-4">
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
                const animalImageSrc = recording.emotions && recording.emotions.length > 0
                  ? (emotionToAnimal[recording.emotions[0]] ?? null)
                  : null;

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
                      <div>
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
                                {animalImageSrc ? (
                                  <img src={animalImageSrc} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-3xl">🎵</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 break-words line-clamp-2">{recording.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(recording.createdAt)}
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
                        <div className="flex justify-end mt-1">
                          <div className="text-gray-400 flex items-center gap-1 text-[10px]">
                            {getVisibilityIcon(recording.visibility)}
                            <span>{getVisibilityLabel(recording.visibility)}</span>
                          </div>
                        </div>
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
                              {animalImageSrc ? (
                                <img src={animalImageSrc} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-5xl">🎵</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <h4 className="font-semibold text-gray-800 text-sm break-words line-clamp-2 mb-1">
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
                        <div className="flex justify-end mt-1">
                          <div className="text-gray-400 flex items-center gap-1 text-[10px]">
                            {getVisibilityIcon(recording.visibility)}
                            <span>{getVisibilityLabel(recording.visibility)}</span>
                          </div>
                        </div>
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
            {/* アルバム台紙：温かみのあるクリーム色＋壁紙のような微細なエンボス質感 */}
            <div
              className="relative bg-[#F3EBDD] rounded-2xl p-5 sm:p-7 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
                backgroundSize: "5px 5px",
                backgroundPosition: "0 0, 2.5px 2.5px",
              }}
            >
              {/* 右上の×ボタン（半透明の円背景・スマホでも押しやすいサイズ） */}
              <button
                type="button"
                onClick={() => setSelectedRecording(null)}
                aria-label="閉じる"
                className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 transition-colors"
              >
                <X size={18} />
              </button>

              {/* ポラロイド本体（白）：上部・左右の白余白を多めに、台紙の上に置かれた柔らかい影 */}
              <div className="relative bg-white rounded-[3px] px-5 sm:px-6 pt-6 pb-6 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.35)]">
                {/* クラフト紙テープ（写真上部中央／セージグリーン・繊維感のあるマットな質感・自然な傾き） */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 rotate-[-3deg] z-20 bg-[#9CB38D] shadow-[0_3px_6px_-1px_rgba(0,0,0,0.22),inset_0_0_10px_rgba(60,75,50,0.18)]"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
                    backgroundSize: "3px 3px, auto",
                  }}
                  aria-hidden="true"
                />

                {/* 写真：極細の境界線で紙に現像された印象（額縁感は出さない） */}
                {Array.isArray(selectedRecording.images) && selectedRecording.images.length > 0 ? (
                  <img
                    src={selectedRecording.images[0]}
                    alt={selectedRecording.title}
                    className="w-full rounded-sm object-cover max-h-64 sm:max-h-72 ring-1 ring-black/[0.07]"
                  />
                ) : (
                  <div className="w-full h-52 rounded-sm bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center ring-1 ring-black/[0.07]">
                    {selectedRecording.emotions && selectedRecording.emotions.length > 0 && emotionToAnimal[selectedRecording.emotions[0]] ? (
                      <img src={emotionToAnimal[selectedRecording.emotions[0]]} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-6xl">🎵</span>
                    )}
                  </div>
                )}

                {/* 写真下の余白に全要素を統合 */}
                <div className="pt-4 px-1 space-y-3 pb-3">
                  {/* 1. タイトル（太文字） */}
                  <p className="text-lg font-bold text-gray-800 tracking-wide leading-snug pr-9">
                    {selectedRecording.title}
                  </p>

                  {/* 2. テキストメモ（未入力時は表示せず自然な余白として扱う） */}
                  {selectedRecording.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedRecording.description}
                    </p>
                  )}

                  {/* 3. 波形表示の音声プレイヤー（透明背景＋薄い瑠璃色の枠線） */}
                  {selectedRecording.audioUrl && (
                    <div className="rounded-2xl bg-transparent border border-[#1e50a2]/30 px-3 py-2.5">
                      <WaveformPlayer
                        src={selectedRecording.audioUrl}
                        duration={selectedRecording.duration}
                      />
                    </div>
                  )}

                  {/* 4. 感情タグ */}
                  {selectedRecording.emotions && selectedRecording.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pr-10">
                      {selectedRecording.emotions.map((emotion: string) => (
                        <span key={emotion} className="text-xs px-2 py-1 bg-blue-50 text-[#2A5CAA] rounded-full">
                          #{emotion}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 録音日時：ポラロイド右下に配置 */}
                <p className="absolute bottom-3 right-4 text-[10px] text-gray-400 whitespace-nowrap">
                  録音日：{formatDateTime(selectedRecording.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </ScreenOverlay>
      )}
    </div>
  );
}
