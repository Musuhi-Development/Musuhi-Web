"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import FooterNav from "@/components/shared/FooterNav";

const TILT_CLASSES = [
  "-rotate-[2deg]", "rotate-[1.5deg]", "-rotate-[1deg]", "rotate-[2.5deg]",
  "-rotate-[0.5deg]", "rotate-[1deg]", "-rotate-[2deg]", "rotate-[0.5deg]",
];

export type CardData = {
  id: string;
  isOrganizer: boolean;
  imageUrl: string | null;
  title: string;
  message: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  participantName: string;
};

type Props = {
  title: string;
  recipientName: string;
  description: string;
  senderName: string;
  cards: CardData[];
  senderView?: boolean;
};

export function YosegakiViewClient({ title, recipientName, description, senderName, cards, senderView = false }: Props) {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* ヘッダー */}
      <div className="bg-gradient-to-b from-[#2A5CAA] to-[#4A7BC8] px-5 pt-10 pb-8 text-white text-center">
        {senderView ? (
          <>
            <p className="text-xs opacity-80 mb-1">お届け済みの寄せ書き</p>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
          </>
        ) : (
          <>
            <p className="text-xs opacity-80 mb-1">みんなからの声の寄せ書き</p>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            <p className="text-sm opacity-80 mt-1">{cards.length}人から届きました</p>
          </>
        )}
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* 便箋カード */}
        <div
          className="relative rounded-2xl bg-[#FAF7F2] border border-[#e7ddd0] shadow-sm px-6 py-6 pb-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, rgba(120,95,55,0.10) 31px, rgba(120,95,55,0.10) 32px)",
          }}
        >
          <img
            src="/icons/mizuhiki-bow.png"
            alt=""
            className="absolute top-3 right-4 w-20 h-6 object-contain opacity-80"
            aria-hidden
          />
          <p className="text-lg font-bold text-gray-800 mb-4">{recipientName}へ</p>
          <p className="text-sm text-gray-700 leading-[2rem] whitespace-pre-wrap">{description}</p>
          <p className="absolute bottom-3 right-4 text-xs text-gray-400">{senderName}より</p>
        </div>

        {/* ポラロイドグリッド */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-3">みんなの声（{cards.length}件）</p>
          <div className="grid grid-cols-3 gap-3">
            {cards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCard(card)}
                className={`bg-white rounded-sm p-2 pb-6 flex flex-col gap-1 text-left transition-shadow active:opacity-80 ${TILT_CLASSES[i % TILT_CLASSES.length]}`}
                style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.15)" }}
              >
                <div
                  className={`w-full aspect-square rounded-sm overflow-hidden ${
                    card.isOrganizer
                      ? "bg-gradient-to-br from-amber-100 to-rose-100"
                      : "bg-gradient-to-br from-teal-100 to-blue-100"
                  }`}
                >
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 font-medium truncate leading-tight mt-1 px-0.5">
                  {card.title}
                </p>
                <div className="flex items-center gap-0.5 px-0.5">
                  {card.isOrganizer && (
                    <img src="/icons/mizuhiki-bow.png" alt="" className="w-4 h-3 object-contain" aria-hidden />
                  )}
                  <p className="text-[9px] text-gray-400 truncate">{card.participantName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* フッター：未登録受取人向けのみ表示 */}
      {!senderView && (
        <div className="bg-gradient-to-b from-transparent to-[#e8e0d5] px-5 pt-8 pb-10 text-center space-y-3">
          <p className="text-xs text-gray-500 font-medium">Powered by Musuhi</p>
          <p className="text-xs text-gray-500">あなたも大切な人へ『声の贈りもの』を届けませんか？</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold text-sm rounded-full shadow-md"
          >
            贈り主にお礼の声を届ける
          </Link>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ×ボタン：スクロールに関わらず常に右上に固定 */}
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
              aria-label="閉じる"
            >
              <X size={18} />
            </button>

            {/* スクロール可能なコンテンツ */}
            <div className="overflow-y-auto">
              {/* 画像 */}
              <div
                className={`relative w-full aspect-video ${
                  selectedCard.isOrganizer
                    ? "bg-gradient-to-br from-amber-100 to-rose-100"
                    : "bg-gradient-to-br from-teal-100 to-blue-100"
                }`}
              >
                {selectedCard.imageUrl ? (
                  <img src={selectedCard.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🎵</div>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* タイトルと参加者名 */}
                <div>
                  <p className="text-base font-bold text-gray-800 pr-8">{selectedCard.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {selectedCard.isOrganizer && (
                      <img src="/icons/mizuhiki-bow.png" alt="" className="w-5 h-4 object-contain" aria-hidden />
                    )}
                    <p className="text-sm text-gray-500">{selectedCard.participantName}</p>
                  </div>
                </div>

                {/* 音声プレーヤー */}
                {selectedCard.audioUrl && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <WaveformPlayer
                      src={selectedCard.audioUrl}
                      duration={selectedCard.audioDuration ?? undefined}
                    />
                  </div>
                )}

                {/* メッセージ */}
                {selectedCard.message && (
                  <p className="text-sm text-gray-700 leading-[1.8rem] whitespace-pre-wrap">
                    {selectedCard.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 贈り手ビュー時はフッターナビを表示 */}
      {senderView && <FooterNav />}
    </div>
  );
}
