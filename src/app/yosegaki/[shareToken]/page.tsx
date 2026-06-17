// 参加者向け表紙ページ（公開・認証不要）
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RegisterInvitee from "./RegisterInvitee";

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

  const now = new Date();
  const isDeadlinePassed = !!(yosegaki.deadline && now > yosegaki.deadline);
  const isAccepting = yosegaki.status === "collecting" && !isDeadlinePassed;
  const organizerName = yosegaki.organizerName || yosegaki.creator.displayName || yosegaki.creator.name || "企画者";
  const senderName = yosegaki.senderName || organizerName;

  // 受付終了画面
  if (isDeadlinePassed) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-5 text-center gap-8">
        <div className="space-y-3">
          <div className="text-5xl mb-4">🎙️</div>
          <h1 className="text-lg font-bold text-gray-800 leading-tight">
            この声の寄せ書きは、募集の受付を終了いたしました
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            たくさんの素敵なメッセージをありがとうございました。
          </p>
        </div>
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-700 font-medium">
            あなた自身の想いも声で残してみませんか？
          </p>
          <Link
            href="/signup"
            className="block w-full bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold text-center py-4 rounded-full shadow-md text-sm"
          >
            Musuhiをはじめる
          </Link>
        </div>
        <p className="text-[10px] text-gray-400">Powered by Musuhi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-32 flex flex-col">
      {/* ログイン済みユーザーを参加者として自動登録（サイレント） */}
      {isAccepting && <RegisterInvitee shareToken={shareToken} />}

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
            <p className="text-right text-[11px] text-gray-400 mt-3">{organizerName}</p>
          </div>
        )}

        {/* 募集期限 */}
        {yosegaki.deadline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-amber-500 text-xl mt-0.5">⏰</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-700">募集期限</p>
              <p className="text-sm text-amber-800">{fmt(yosegaki.deadline)}</p>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed text-right shrink-0 max-w-[140px] mt-0.5">
              ※締切を過ぎると参加できなくなります。録音は30秒程度で完了します
            </p>
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
            <p className="absolute bottom-3 right-4 text-xs text-gray-400">{senderName}より</p>
          </div>
        )}

        {/* 企画者ポラロイド */}
        {(yosegaki.organizerImageUrl || yosegaki.organizerAudioUrl || yosegaki.organizerAudioTitle) && (
          <div
            className="relative rounded-2xl p-5"
            style={{
              backgroundColor: "#F3EBDD",
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(120,95,55,0.06) 0.5px, transparent 0.5px)",
              backgroundSize: "5px 5px",
              backgroundPosition: "0 0, 2.5px 2.5px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="relative bg-white px-5 pt-6 pb-6"
              style={{
                borderRadius: "3px",
                boxShadow: "0 16px 34px -8px rgba(0,0,0,0.35)",
              }}
            >
              {/* クラフト紙テープ */}
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-7 z-20"
                style={{
                  transform: "translateX(-50%) rotate(-3deg)",
                  backgroundColor: "#9CB38D",
                  boxShadow: "0 3px 6px -1px rgba(0,0,0,0.22), inset 0 0 10px rgba(60,75,50,0.18)",
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.6px), repeating-linear-gradient(112deg, rgba(60,75,50,0.05) 0px, rgba(60,75,50,0.05) 1px, transparent 1px, transparent 3px)",
                  backgroundSize: "3px 3px, auto",
                }}
                aria-hidden="true"
              />
              {yosegaki.organizerImageUrl ? (
                <img
                  src={yosegaki.organizerImageUrl}
                  alt=""
                  className="w-full rounded-sm object-cover max-h-64"
                  style={{ outline: "1px solid rgba(0,0,0,0.07)" }}
                />
              ) : (
                <div
                  className="w-full h-52 rounded-sm flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #ccfbf1, #bfdbfe)",
                    outline: "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <span className="text-6xl">🎵</span>
                </div>
              )}
              <div className="pt-4 px-1 space-y-3 pb-3">
                <p className="text-lg font-bold text-gray-800">
                  {yosegaki.organizerAudioTitle || "（タイトルなし）"}
                </p>
                {yosegaki.organizerAudioComment && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {yosegaki.organizerAudioComment}
                  </p>
                )}
                {yosegaki.organizerAudioUrl && (
                  <div
                    className="rounded-2xl px-3 py-2.5"
                    style={{ border: "1px solid rgba(30,80,162,0.3)" }}
                  >
                    <audio src={yosegaki.organizerAudioUrl} controls className="w-full h-10" />
                  </div>
                )}
              </div>
              <p
                className="text-right"
                style={{ fontSize: "10px", color: "#9ca3af" }}
              >
                {organizerName}
              </p>
            </div>
          </div>
        )}

        {/* 受付停止メッセージ（status が collecting 以外の場合） */}
        {!isAccepting && !isDeadlinePassed && (
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
            className="flex items-center justify-center gap-2 mx-4 bg-gradient-to-r from-[#2A5CAA] to-[#4A7BC8] text-white font-bold text-center py-4 rounded-2xl shadow-lg text-sm mb-2"
          >
            <span>🎙️</span>
            <span>この&quot;声の寄せ書き&quot;に参加する</span>
          </Link>
        )}
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Powered by Musuhi</p>
        </div>
      </div>
    </div>
  );
}
