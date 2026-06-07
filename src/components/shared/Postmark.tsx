"use client";

import { useId } from "react";

// 朱色（消印インク）
const VERMILION = "#C8412B";

/**
 * 郵便物の消印（けしいん）をイメージした装飾シグネチャ。
 * 朱色のかすれたインクで、二重円・円弧テキスト（上「PRESENT FOR YOU」／下「MUSUHI」）と、
 * 中央に葉っぱのマーク＋「THANKS」を配し、本物の郵便消印のような雰囲気を出す。
 * カード右上などに薄く重ねて使う想定（傾き・透明度は呼び出し側 className で調整可）。
 */
export function Postmark({ className }: { className?: string }) {
  const rawId = useId();
  const arcTopId = `pm-top-${rawId.replace(/[:]/g, "")}`;
  const arcBottomId = `pm-bottom-${rawId.replace(/[:]/g, "")}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke={VERMILION}
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        {/* 上弧（テキストを時計回りに沿わせる） */}
        <path id={arcTopId} d="M22 50 A28 28 0 0 1 78 50" />
        {/* 下弧 */}
        <path id={arcBottomId} d="M25 53 A25 25 0 0 0 75 53" />
      </defs>

      {/* 郵便消印キャンセリングライン（消印の左側から3本の平行波線） */}
      <path d="M -25 43 C -20.6 41.5 -17.4 41.5 -13 43 C -8.6 44.5 -5.4 44.5 -1 43 C 3.4 41.5 6.6 41.5 11 43 C 15.4 44.5 18.6 44.5 23 43 C 27.4 41.5 30.6 41.5 35 43 C 39.4 44.5 42.6 44.5 47 43 C 51.4 41.5 54.6 41.5 59 43 C 63.4 44.5 66.6 44.5 71 43 C 75.4 41.5 78.6 41.5 83 43 L 84 43" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M -25 50 C -20.6 48.5 -17.4 48.5 -13 50 C -8.6 51.5 -5.4 51.5 -1 50 C 3.4 48.5 6.6 48.5 11 50 C 15.4 51.5 18.6 51.5 23 50 C 27.4 48.5 30.6 48.5 35 50 C 39.4 51.5 42.6 51.5 47 50 C 51.4 48.5 54.6 48.5 59 50 C 63.4 51.5 66.6 51.5 71 50 C 75.4 48.5 78.6 48.5 83 50 L 84 50" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M -25 57 C -20.6 55.5 -17.4 55.5 -13 57 C -8.6 58.5 -5.4 58.5 -1 57 C 3.4 55.5 6.6 55.5 11 57 C 15.4 58.5 18.6 58.5 23 57 C 27.4 55.5 30.6 55.5 35 57 C 39.4 58.5 42.6 58.5 47 57 C 51.4 55.5 54.6 55.5 59 57 C 63.4 58.5 66.6 58.5 71 57 C 75.4 55.5 78.6 55.5 83 57 L 84 57" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* 二重円 */}
      <circle cx="50" cy="50" r="34" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="28" strokeWidth="1.2" />

      {/* 上部の円弧テキスト */}
      <text fill={VERMILION} stroke="none" fontSize="8" fontWeight="700" letterSpacing="1">
        <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
          PRESENT FOR YOU
        </textPath>
      </text>
      {/* 下部の円弧テキスト */}
      <text fill={VERMILION} stroke="none" fontSize="8.5" fontWeight="700" letterSpacing="2.5">
        <textPath href={`#${arcBottomId}`} startOffset="50%" textAnchor="middle">
          MUSUHI
        </textPath>
      </text>

      {/* 中央: 葉っぱのマーク */}
      <path d="M50 36 C 45.5 39.5, 45.5 45, 50 47.5 C 54.5 45, 54.5 39.5, 50 36 Z" strokeWidth="1.6" />
      <path d="M50 37.5 L 50 46.5" strokeWidth="1.1" />

      {/* 中央: THANKS */}
      <text
        x="50"
        y="60"
        fill={VERMILION}
        stroke="none"
        fontSize="9"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        THANKS
      </text>
    </svg>
  );
}
