"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Play, Pause, Volume2 } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import RecordingModal from "@/components/RecordingModal";

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

type Board = {
  id: string;
  title: string;
  content: string | null;
  audioUrl: string | null;
  duration: number | null;
  isPublic: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
  likes: { id: string }[];
  // homeのUIに合わせるためemotionsを追加
  emotions?: string[];
};

type VoiceComment = {
  id: string;
  content: string | null;
  audioUrl: string | null;
  duration: number | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export default function BoardPage() {
  const [activeScope, setActiveScope] = useState<"all" | "friends">("all");
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [commentsByBoard, setCommentsByBoard] = useState<Record<string, VoiceComment[]>>({});
  const [showAllCommentsByBoard, setShowAllCommentsByBoard] = useState<Record<string, boolean>>({});
  const [commentLoadingByBoard, setCommentLoadingByBoard] = useState<Record<string, boolean>>({});
  const [commentErrorByBoard, setCommentErrorByBoard] = useState<Record<string, string | null>>({});
  const [commentModalBoardId, setCommentModalBoardId] = useState<string | null>(null);
  const [submittingCommentBoardId, setSubmittingCommentBoardId] = useState<string | null>(null);
  const router = useRouter();

  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchUser();
    fetchBoards();
  }, [activeScope]);

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

  async function fetchBoards() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeScope === "all") {
        params.set("public", "true");
      }
      
      const res = await fetch(`/api/board?${params.toString()}`);
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("投稿の取得に失敗しました");
      }
      
      const data = await res.json();
      // TODO: API側でemotionsを返すように修正する
      const boardsWithDemoEmotions = data.boards.map((b: Board) => ({
        ...b,
        emotions: ['楽しい', '感謝'].slice(0, Math.floor(Math.random() * 3))
      }));
      setBoards(boardsWithDemoEmotions || []);

      await Promise.all(
        (boardsWithDemoEmotions || []).map((board: Board) =>
          fetchComments(board.id, { silent: true })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(boardId: string) {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const isLiked = board.likes.length > 0;
      const method = isLiked ? "DELETE" : "POST";
      
      const res = await fetch(`/api/board/${boardId}/like`, { method });
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!res.ok) {
        throw new Error("いいねに失敗しました");
      }
      
      // Optimistically update UI
      setBoards(prev => prev.map(b => {
        if (b.id === boardId) {
          return {
            ...b,
            likes: isLiked ? [] : [{ id: "temp" }],
            _count: {
              ...b._count,
              likes: b._count.likes + (isLiked ? -1 : 1),
            },
          };
        }
        return b;
      }));
    } catch (err) {
      console.error("Like error:", err);
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "00:00";
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

  // Audio playback functions
  function togglePlayPause(board: Board, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!board.audioUrl) {
      alert("音声ファイルが見つかりません");
      return;
    }

    // If clicking the same recording that's playing, pause it
    if (playingId === board.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // If clicking a different recording, or the same one that was paused
    if (playingId !== board.id) {
      // Stop previous audio if any
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(board.audioUrl);
      audioRef.current = audio;
      setPlayingId(board.id);

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

  async function fetchComments(boardId: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setCommentLoadingByBoard((prev) => ({ ...prev, [boardId]: true }));
      setCommentErrorByBoard((prev) => ({ ...prev, [boardId]: null }));
    }

    try {
      const res = await fetch(`/api/board/${boardId}/comment`);

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        if (!options?.silent) {
          throw new Error("コメントの取得に失敗しました");
        }
        return;
      }

      const data = await res.json();
      setCommentsByBoard((prev) => ({ ...prev, [boardId]: data.comments || [] }));
    } catch (err) {
      if (options?.silent) {
        return;
      }
      setCommentErrorByBoard((prev) => ({
        ...prev,
        [boardId]: err instanceof Error ? err.message : "コメントの取得に失敗しました",
      }));
    } finally {
      if (!options?.silent) {
        setCommentLoadingByBoard((prev) => ({ ...prev, [boardId]: false }));
      }
    }
  }

  async function openVoiceCommentModal(boardId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    setCommentModalBoardId(boardId);
    setCommentErrorByBoard((prev) => ({ ...prev, [boardId]: null }));

    if (!commentsByBoard[boardId]) {
      await fetchComments(boardId);
    }
  }

  async function handleVoiceCommentSubmit(payload: { audioBlob: Blob; duration: number }) {
    if (!commentModalBoardId) {
      throw new Error("対象ボードが見つかりません");
    }

    setSubmittingCommentBoardId(commentModalBoardId);
    setCommentErrorByBoard((prev) => ({ ...prev, [commentModalBoardId]: null }));

    try {
      const formData = new FormData();
      formData.append("file", payload.audioBlob, "voice-comment.webm");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("音声アップロードに失敗しました");
      }

      const uploadData = await uploadRes.json();

      const commentRes = await fetch(`/api/board/${commentModalBoardId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: uploadData.url,
          duration: payload.duration,
        }),
      });

      if (!commentRes.ok) {
        throw new Error("コメント投稿に失敗しました");
      }

      const { comment } = await commentRes.json();

      setCommentsByBoard((prev) => ({
        ...prev,
        [commentModalBoardId]: [...(prev[commentModalBoardId] || []), comment],
      }));

      setBoards((prev) =>
        prev.map((board) =>
          board.id === commentModalBoardId
            ? {
                ...board,
                _count: {
                  ...board._count,
                  comments: board._count.comments + 1,
                },
              }
            : board
        )
      );
      setCommentModalBoardId(null);
    } catch (err) {
      setCommentErrorByBoard((prev) => ({
        ...prev,
        [commentModalBoardId]: err instanceof Error ? err.message : "コメント投稿に失敗しました",
      }));
      throw err;
    } finally {
      setSubmittingCommentBoardId(null);
    }
  }

  function toggleCommentPlayback(comment: VoiceComment, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!comment.audioUrl) {
      return;
    }

    const playbackId = `comment-${comment.id}`;

    if (playingId === playbackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (playingId !== playbackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(comment.audioUrl);
      audioRef.current = audio;
      setPlayingId(playbackId);

      audio.onended = () => {
        setIsPlaying(false);
        setPlayingId(null);
      };

      audio.onerror = () => {
        alert("音声の再生に失敗しました");
        setIsPlaying(false);
        setPlayingId(null);
      };

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Playback error:", err);
          alert("音声の再生に失敗しました");
          setIsPlaying(false);
          setPlayingId(null);
        });
      return;
    }

    audioRef.current?.play();
    setIsPlaying(true);
  }

  const filteredPosts = activeScope === "friends" 
    ? boards.filter(b => !b.isPublic)
    : boards;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Board</h1>
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

      <div className="px-6 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveScope("all")}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition-all",
              activeScope === "all"
                ? "bg-[#2A5CAA] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            全体
          </button>
          <button
            onClick={() => setActiveScope("friends")}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition-all",
              activeScope === "friends"
                ? "bg-[#2A5CAA] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            家族・友人/知人
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#2A5CAA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchBoards}
              className="px-6 py-2 bg-[#2A5CAA] text-white rounded-full hover:bg-[#1F4580] transition-colors shadow-md"
            >
              再試行
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl shadow-md p-6">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600">投稿がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post) => {
                  const isLiked = post.likes.length > 0;
                  const comments = commentsByBoard[post.id] || [];
                  const voiceComments = comments.filter((comment) => Boolean(comment.audioUrl));
                  const showAllComments = showAllCommentsByBoard[post.id] || false;
                  const visibleVoiceComments = showAllComments ? voiceComments : voiceComments.slice(0, 3);
                  const animalIcon = post.emotions && post.emotions.length > 0 
                    ? emotionToAnimal[post.emotions[0]] || "🎵"
                    : "🎵";

                  return (
                    <div key={post.id} className="bg-white rounded-2xl shadow-md p-4">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail with Play Button */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                            <span className="text-3xl">{animalIcon}</span>
                          </div>
                          {post.audioUrl && (
                            <>
                              <button
                                onClick={(e) => togglePlayPause(post, e)}
                                className={clsx(
                                  "absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all rounded-xl",
                                  playingId === post.id && isPlaying && "bg-black/30"
                                )}
                                aria-label={playingId === post.id && isPlaying ? "一時停止" : "再生"}
                              >
                                {playingId === post.id && isPlaying ? (
                                  <Pause className="text-white drop-shadow-lg" size={24} fill="white" />
                                ) : (
                                  <Play className="text-white drop-shadow-lg" size={24} fill="white" />
                                )}
                              </button>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                <Volume2 size={12} className="text-[#2A5CAA]" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{post.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(post.createdAt)}
                            {post.duration && ` · ${formatDuration(post.duration)}`}
                          </p>
                          {post.emotions && post.emotions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {post.emotions.slice(0, 3).map((e: string) => (
                                <span key={e} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-[#2A5CAA] rounded-md">
                                  #{e}
                                </span>
                              ))}
                            </div>
                          )}
                           <div className="flex items-center gap-2 mt-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200">
                                {post.author.avatarUrl ? (
                                  <img src={post.author.avatarUrl} alt={post.author.displayName || post.author.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs text-gray-500 flex items-center justify-center w-full h-full">
                                    {(post.author.displayName || post.author.name)[0]}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-600">{post.author.displayName || post.author.name}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-4">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLike(post.id);
                            }}
                            className={clsx(
                              "flex items-center gap-1 transition-all",
                              isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                            )}
                          >
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                            <span className="text-xs font-medium">{post._count.likes}</span>
                          </button>
                          <button 
                           onClick={(e) => {
                            openVoiceCommentModal(post.id, e);
                           }}
                           className="flex items-center gap-1 transition-colors text-gray-400 hover:text-[#2A5CAA]"
                          >
                            <MessageCircle size={18} />
                            <span className="text-xs font-medium">{post._count.comments}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-700">ボイスコメント</p>
                          <button
                            onClick={(e) => openVoiceCommentModal(post.id, e)}
                            className="text-xs text-[#2A5CAA] font-medium hover:text-[#1F4580]"
                          >
                            コメントする
                          </button>
                        </div>

                        {commentErrorByBoard[post.id] && (
                          <p className="text-xs text-red-500 mb-2">{commentErrorByBoard[post.id]}</p>
                        )}

                        {commentLoadingByBoard[post.id] ? (
                          <p className="text-sm text-gray-500">コメントを読み込み中...</p>
                        ) : visibleVoiceComments.length === 0 ? (
                          <p className="text-sm text-gray-500">まだボイスコメントはありません</p>
                        ) : (
                          <div className="space-y-2">
                            {visibleVoiceComments.map((comment) => {
                              const isCommentPlaying = playingId === `comment-${comment.id}` && isPlaying;
                              return (
                                <div key={comment.id} className="ml-4 flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                      {comment.author.avatarUrl ? (
                                        <img
                                          src={comment.author.avatarUrl}
                                          alt={comment.author.displayName || comment.author.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-xs text-gray-500 flex items-center justify-center w-full h-full">
                                          {(comment.author.displayName || comment.author.name)[0]}
                                        </span>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-gray-700 truncate">
                                        {comment.author.displayName || comment.author.name}
                                      </p>
                                      <p className="text-[11px] text-gray-500">
                                        {formatDate(comment.createdAt)}
                                        {comment.duration ? ` · ${formatDuration(comment.duration)}` : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={(e) => toggleCommentPlayback(comment, e)}
                                    className="w-9 h-9 rounded-full bg-[#2A5CAA] text-white flex items-center justify-center flex-shrink-0"
                                    aria-label={isCommentPlaying ? "一時停止" : "再生"}
                                  >
                                    {isCommentPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                                  </button>
                                </div>
                              );
                            })}

                            {voiceComments.length > 3 && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowAllCommentsByBoard((prev) => ({
                                    ...prev,
                                    [post.id]: !showAllComments,
                                  }));
                                }}
                                className="text-xs text-[#2A5CAA] font-medium hover:text-[#1F4580] ml-4"
                              >
                                {showAllComments
                                  ? "コメントを閉じる"
                                  : `さらに${voiceComments.length - 3}件のコメントを見る`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <RecordingModal
        isOpen={Boolean(commentModalBoardId)}
        onClose={() => {
          if (!submittingCommentBoardId) {
            setCommentModalBoardId(null);
          }
        }}
        variant="voice-comment"
        onSubmitVoiceComment={handleVoiceCommentSubmit}
      />
    </div>
  );
}
