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

      {/* 郵便消印キャンセリングライン（消印の左側から3本の平行横線） */}
      <line x1="-25" y1="43" x2="84" y2="43" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="-25" y1="50" x2="84" y2="50" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="-25" y1="57" x2="84" y2="57" strokeWidth="1.8" strokeLinecap="round" />

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
