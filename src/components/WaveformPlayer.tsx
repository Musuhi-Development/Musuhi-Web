"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { clsx } from "clsx";

const BAR_COUNT = 48;

/**
 * 将来的に実音声の解析結果（0〜1 に正規化したピーク配列）を `peaks` として渡せば、
 * そのまま波形として描画できる構造にしている。
 * `peaks` 未指定の場合は `src` を seed にした安定した擬似波形を生成して表示する
 * （再レンダリングのたびに形が変わらないようにするため）。
 */
function pseudoPeaks(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const peaks: number[] = [];
  for (let i = 0; i < BAR_COUNT; i += 1) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const base = (h % 1000) / 1000; // 0..1
    // 中央が高く端が低い自然なエンベロープをかける
    const envelope = Math.sin((i / (BAR_COUNT - 1)) * Math.PI);
    peaks.push(Math.min(1, Math.max(0.14, base * 0.75 * envelope + 0.16)));
  }
  return peaks;
}

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type WaveformPlayerProps = {
  src: string;
  /** 録音の長さ（秒）。メタデータ取得前のフォールバック表示に使う */
  duration?: number;
  /** 実音声から生成した波形ピーク（0〜1）。将来的に解析結果を渡せる */
  peaks?: number[];
  className?: string;
};

export function WaveformPlayer({ src, duration, peaks, className }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  const bars = useMemo(
    () => (peaks && peaks.length > 0 ? peaks : pseudoPeaks(src)),
    [peaks, src]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => setCurrent(audio.currentTime);
    const resolveTotal = () => {
      // MediaRecorder生成のwebmはduration=Infinityになるため、有限値のみ採用しpropにフォールバック
      const d = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : (duration ?? 0);
      setTotal(d);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", resolveTotal);
    audio.addEventListener("durationchange", resolveTotal);
    audio.addEventListener("ended", handleEnded);

    // すでにメタデータ取得済みの場合（キャッシュ等）は即時反映
    if (audio.readyState >= 1) resolveTotal();

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", resolveTotal);
      audio.removeEventListener("durationchange", resolveTotal);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [duration]);

  const progress = total > 0 ? current / total : 0;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  };

  const seekFromEvent = (clientX: number, target: HTMLDivElement) => {
    if (!total) return;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = ratio * total;
      setCurrent(ratio * total);
    }
  };

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "一時停止" : "再生"}
        className="shrink-0 w-9 h-9 rounded-full bg-[#1e50a2] text-white flex items-center justify-center shadow-sm hover:bg-[#1a4690] transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
      </button>

      <div
        role="slider"
        aria-label="再生位置"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        className="relative flex-1 flex items-center gap-[2px] h-9 cursor-pointer"
        onClick={(event) => seekFromEvent(event.clientX, event.currentTarget)}
      >
        {bars.map((peak, index) => {
          const filled = index / bars.length <= progress;
          return (
            <span
              key={index}
              className={clsx(
                "flex-1 rounded-full transition-colors",
                filled ? "bg-[#1e50a2]" : "bg-gray-300"
              )}
              style={{ height: `${Math.round(peak * 100)}%` }}
            />
          );
        })}
      </div>

      <span className="shrink-0 text-[11px] tabular-nums text-gray-500 w-[72px] text-right">
        {formatTime(current)} / {formatTime(total)}
      </span>
    </div>
  );
}
