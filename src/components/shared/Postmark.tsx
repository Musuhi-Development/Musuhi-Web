"use client";

import { useId } from "react";

/**
 * 郵便物の消印（けしいん）をイメージした装飾シグネチャ。
 * 瑠璃色 #1e50a2 のかすれたインクで、二重円・円弧テキスト・中央の日付・
 * 抹消の波線を描き、本物のスタンプのような雰囲気を出す。
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
      stroke="#1e50a2"
      aria-hidden="true"
    >
      <defs>
        {/* 上弧（テキストを時計回りに沿わせる） */}
        <path id={arcTopId} d="M22 50 A28 28 0 0 1 78 50" />
        {/* 下弧 */}
        <path id={arcBottomId} d="M24 52 A26 26 0 0 0 76 52" />
      </defs>

      {/* 二重円 */}
      <circle cx="50" cy="50" r="34" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="28" strokeWidth="1.4" />

      {/* 円弧に沿った文字 */}
      <text
        fill="#1e50a2"
        stroke="none"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2"
      >
        <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
          MUSUHI
        </textPath>
      </text>
      <text
        fill="#1e50a2"
        stroke="none"
        fontSize="6.5"
        letterSpacing="1.5"
      >
        <textPath href={`#${arcBottomId}`} startOffset="50%" textAnchor="middle">
          VOICE GIFT
        </textPath>
      </text>

      {/* 中央の日付風ライン */}
      <line x1="36" y1="46" x2="64" y2="46" strokeWidth="1.4" strokeLinecap="round" />
      <text
        x="50"
        y="55"
        fill="#1e50a2"
        stroke="none"
        fontSize="8"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="1"
      >
        結
      </text>

      {/* 抹消の波線（右へ伸びる消印の波） */}
      <path
        d="M84 40 q8 4 0 8 q-8 4 0 8 q8 4 0 8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
