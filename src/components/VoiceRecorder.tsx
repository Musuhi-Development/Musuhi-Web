"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Pause, Square, Play, Loader2 } from "lucide-react";
import { clsx } from "clsx";

type VoiceRecorderProps = {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // 秒単位
  className?: string;
};

export default function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 180,
  className = "",
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioBlob, recordedSeconds);

        // ストリームを停止
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now() - pausedTimeRef.current;

      // タイマー開始
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordedSeconds(elapsed);

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (error) {
      console.error("マイクへのアクセスエラー:", error);
      alert("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordedSeconds(elapsed);

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setRecordedSeconds(0);
    pausedTimeRef.current = 0;
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={clsx("flex flex-col items-center", className)}>
      {/* ビジュアライザー */}
      <div className="h-48 w-full bg-gray-50 flex items-center justify-center flex-col gap-4 border-b relative rounded-lg mb-4">
        <div className="flex items-center justify-center gap-1 h-12">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={clsx(
                "w-1 rounded-full bg-orange-400 transition-all duration-300"
              )}
              style={{
                height:
                  isRecording && !isPaused
                    ? `${Math.random() * 30 + 10}px`
                    : "4px",
              }}
            ></div>
          ))}
        </div>
        <div className="text-3xl font-mono text-gray-700 tracking-wider">
          {formatTime(recordedSeconds)}
        </div>
        <div className="text-xs text-gray-400">
          最大 {formatTime(maxDuration)}
        </div>
        {recordedSeconds >= maxDuration && (
          <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
            最大時間に達しました
          </div>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="flex justify-center items-center gap-8 py-6">
        {!isRecording && !audioURL ? (
          // 録音開始ボタン
          <button
            onClick={startRecording}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
          >
            <Mic className="text-white" size={32} />
          </button>
        ) : isRecording ? (
          // 録音中: 一時停止 & 停止
          <>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300"
            >
              {isPaused ? <Mic size={24} /> : <Pause size={24} />}
            </button>
            <button
              onClick={stopRecording}
              className="w-16 h-16 border-4 border-gray-200 rounded-full flex items-center justify-center overflow-hidden hover:border-gray-300"
            >
              <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
            </button>
          </>
        ) : (
          // 録音完了: 再生 & 録り直し
          <div className="flex gap-4 items-center">
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600"
            >
              {isPlaying ? (
                <Pause className="text-white" size={24} />
              ) : (
                <Play className="text-white ml-1" size={24} />
              )}
            </button>
            <button
              onClick={resetRecording}
              className="text-sm text-red-500 font-medium"
            >
              録り直す
            </button>
          </div>
        )}
      </div>

      {/* 非表示のaudio要素 */}
      {audioURL && (
        <audio
          ref={audioRef}
          src={audioURL}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
