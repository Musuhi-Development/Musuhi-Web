/**
 * 祝儀袋の蝶結び水引をミニマルに再解釈したブランドシグネチャ。
 * 瑠璃色 #1e50a2 の1色・太めの線で「結び（Musuhi）」を象徴する。
 * 左右対称の輪と、中央で交差して垂れる2本の紐で水引らしさを表現。
 */
export function MizuhikiBow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 56"
      className={className}
      fill="none"
      stroke="#1e50a2"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 左の輪 */}
      <path d="M40 27 C 20 5, 5 15, 13 28 C 18 36, 33 34, 40 27" />
      {/* 右の輪 */}
      <path d="M40 27 C 60 5, 75 15, 67 28 C 62 36, 47 34, 40 27" />
      {/* 中央で交差して垂れる2本の紐 */}
      <path d="M38 28 C 41 40, 47 47, 54 53" />
      <path d="M42 28 C 39 40, 33 47, 26 53" />
      {/* 横線（左右に渡る水引の紐） */}
      <path d="M6 27 C 22 24, 58 24, 74 27" />
      {/* 結び目 */}
      <ellipse cx="40" cy="27" rx="3" ry="4" fill="#1e50a2" stroke="none" />
    </svg>
  );
}
