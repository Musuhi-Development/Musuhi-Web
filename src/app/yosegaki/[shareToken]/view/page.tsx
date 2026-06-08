// 完成版寄せ音声の公開閲覧ページ（認証不要）
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ shareToken: string }> };

const TILT_CLASSES = [
  "-rotate-[2deg]", "rotate-[1.5deg]", "-rotate-[1deg]", "rotate-[2.5deg]",
  "-rotate-[0.5deg]", "rotate-[1deg]", "-rotate-[2deg]", "rotate-[0.5deg]",
];

export default async function YosegakiViewPage({ params }: Props) {
  const { shareToken } = await params;

  const yosegaki = await prisma.yosegaki.findUnique({
    where: { shareToken },
    include: {
      creator: {
        select: { id: true, name: true, displayName: true, avatarUrl: true },
      },
      contributions: {
        orderBy: { createdAt: "asc" },
        include: {
          contributor: {
            select: { id: true, name: true, displayName: true, avatarUrl: true },
          },
          recording: {
            select: { id: true, title: true, audioUrl: true, duration: true, images: true },
          },
        },
      },
    },
  });

  if (!yosegaki || (yosegaki.status !== "completed" && yosegaki.status !== "delivered")) {
    notFound();
  }

  const organizerName = yosegaki.organizerName || yosegaki.creator.displayName || yosegaki.creator.name || "企画者";

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* ヘッダー */}
      <div className="bg-gradient-to-b from-[#2A5CAA] to-[#4A7BC8] px-5 pt-10 pb-8 text-white text-center">
        <p className="text-xs opacity-80 mb-1">みんなからの声の寄せ書き</p>
        <h1 className="text-2xl font-bold">{yosegaki.recipientName}へ</h1>
        <p className="text-sm opacity-80 mt-1">
          {yosegaki.contributions.length + 1}人から届きました
        </p>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* 便箋 */}
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
          <p className="text-lg font-bold text-gray-800 mb-4">{yosegaki.recipientName}へ</p>
          <p className="text-sm text-gray-700 leading-[2rem] whitespace-pre-wrap">
            {yosegaki.description || ""}
          </p>
          <p className="absolute bottom-3 right-4 text-xs text-gray-400">{organizerName}より</p>
        </div>

        {/* ポラロイドグリッド */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-3">みんなの声</p>
          <div className="grid grid-cols-3 gap-3">
            {/* 企画者ポラロイド（先頭） */}
            <div
              className={`bg-white rounded-sm shadow-md p-2 pb-6 flex flex-col gap-1 ${TILT_CLASSES[0]}`}
              style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.15)" }}
            >
              <div className="w-full aspect-square bg-gradient-to-br from-amber-100 to-rose-100 rounded-sm overflow-hidden">
                {yosegaki.organizerImageUrl ? (
                  <img src={yosegaki.organizerImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                )}
              </div>
              <p className="text-[10px] text-gray-600 font-medium truncate leading-tight mt-1 px-0.5">
                {yosegaki.organizerAudioTitle || "企画者メッセージ"}
              </p>
              <div className="flex items-center gap-0.5 px-0.5">
                <img src="/icons/mizuhiki-bow.png" alt="" className="w-4 h-3 object-contain" aria-hidden />
                <p className="text-[9px] text-gray-400 truncate">{organizerName}</p>
              </div>
            </div>

            {/* 参加者ポラロイド */}
            {yosegaki.contributions.map((c, i) => {
              const imageUrl = c.imageUrl || (Array.isArray(c.recording?.images) ? (c.recording.images as string[])[0] : null);
              const name = c.participantName || c.contributor?.displayName || c.contributor?.name || "参加者";
              const title = c.title || c.recording?.title || "（タイトルなし）";
              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-sm shadow-md p-2 pb-6 flex flex-col gap-1 ${TILT_CLASSES[(i + 1) % TILT_CLASSES.length]}`}
                  style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.15)" }}
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-teal-100 to-blue-100 rounded-sm overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 font-medium truncate leading-tight mt-1 px-0.5">
                    {title}
                  </p>
                  <p className="text-[9px] text-gray-400 truncate px-0.5">{name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="bg-gradient-to-b from-transparent to-[#e8e0d5] px-5 pt-8 pb-10 text-center space-y-3">
        <p className="text-xs text-gray-500 font-medium">Powered by Musuhi</p>
        <p className="text-xs text-gray-500">あなたも大切な人へ『声の贈りもの』を届けませんか？</p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold text-sm rounded-full shadow-md"
        >
          Musuhiをはじめる
        </Link>
      </div>
    </div>
  );
}
