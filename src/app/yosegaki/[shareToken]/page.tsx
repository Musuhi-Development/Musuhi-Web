// 参加者向け表紙ページ（公開・認証不要）
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ shareToken: string }> };

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmt(d: Date | null | undefined) {
  if (!d) return "–";
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function YosegakiLandingPage({ params }: Props) {
  const { shareToken } = await params;

  const yosegaki = await prisma.yosegaki.findUnique({
    where: { shareToken },
    include: {
      creator: {
        select: { id: true, name: true, displayName: true, avatarUrl: true },
      },
    },
  });

  if (!yosegaki || yosegaki.status === "draft") {
    notFound();
  }

  const isAccepting = yosegaki.status === "collecting";
  const organizerName = yosegaki.organizerName || yosegaki.creator.displayName || yosegaki.creator.name || "企画者";

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-gradient-to-b from-[#2A5CAA] to-[#4A7BC8] px-5 pt-10 pb-8 text-white text-center">
        <p className="text-xs opacity-80 mb-1">声の寄せ書き</p>
        <h1 className="text-2xl font-bold mb-1">{yosegaki.recipientName}へ</h1>
        <p className="text-sm opacity-80">企画: {organizerName}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5 max-w-md mx-auto w-full">

        {/* 依頼コメント */}
        {yosegaki.organizerComment && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-2">参加への依頼コメント</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {yosegaki.organizerComment}
            </p>
          </div>
        )}

        {/* 募集期限 */}
        {yosegaki.deadline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="text-amber-500 text-xl">⏰</div>
            <div>
              <p className="text-xs font-bold text-amber-700">募集期限</p>
              <p className="text-sm text-amber-800">{fmt(yosegaki.deadline)}</p>
            </div>
          </div>
        )}

        {/* 便箋（メインメッセージ） */}
        {yosegaki.description && (
          <div
            className="relative rounded-2xl bg-[#FAF7F2] border border-[#e7ddd0] shadow-sm px-6 py-6 pb-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 31px, rgba(120,95,55,0.10) 31px, rgba(120,95,55,0.10) 32px)",
            }}
          >
            <p className="text-lg font-bold text-gray-800 mb-4">{yosegaki.recipientName}へ</p>
            <p className="text-sm text-gray-700 leading-[2rem] whitespace-pre-wrap">{yosegaki.description}</p>
            <p className="absolute bottom-3 right-4 text-xs text-gray-400">{organizerName}より</p>
          </div>
        )}

        {/* 企画者ポラロイド */}
        {yosegaki.organizerImageUrl && (
          <div className="flex flex-col items-center">
            <div
              className="bg-white p-3 pb-8 shadow-md rounded-sm w-48"
              style={{ transform: "rotate(-1.5deg)", boxShadow: "3px 4px 12px rgba(0,0,0,0.15)" }}
            >
              <img
                src={yosegaki.organizerImageUrl}
                alt=""
                className="w-full aspect-square object-cover"
              />
              <p className="text-[11px] text-gray-600 font-medium mt-2 text-center truncate">
                {yosegaki.organizerAudioTitle || "企画者メッセージ"}
              </p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <img src="/icons/mizuhiki-bow.png" alt="" className="w-4 h-3 object-contain" aria-hidden />
                <p className="text-[10px] text-gray-400">{organizerName}</p>
              </div>
            </div>
          </div>
        )}

        {/* ステータス別メッセージ */}
        {!isAccepting && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500">この声の寄せ書きは現在参加を受け付けていません。</p>
          </div>
        )}
      </div>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t px-5 py-4 space-y-2">
        {isAccepting && (
          <Link
            href={`/yosegaki/${shareToken}/contribute`}
            className="block w-full bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold text-center py-4 rounded-full shadow-lg text-sm"
          >
            あなたも参加する 🎙️
          </Link>
        )}
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Powered by Musuhi</p>
        </div>
      </div>
    </div>
  );
}
