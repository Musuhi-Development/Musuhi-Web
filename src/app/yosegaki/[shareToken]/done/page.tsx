// 参加完了ページ（公開・認証不要）
import Link from "next/link";

type Props = { searchParams: Promise<{ name?: string }> };

export default async function ContributionDonePage({ searchParams }: Props) {
  const { name } = await searchParams;
  const recipientName = name ? decodeURIComponent(name) : "みなさん";

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-5 text-center gap-8">
      <div className="space-y-2">
        <div className="text-5xl mb-4">🎙️</div>
        <h1 className="text-xl font-bold text-gray-800 leading-tight">
          あなたの声が、みんなで届けるボイスギフトに加わりました。
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed mt-3">
          {recipientName}さんへの想いを届けていただき、ありがとうございます。
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
        <Link
          href="/login"
          className="block w-full text-center text-xs text-gray-400 underline"
        >
          すでにアカウントをお持ちの方はこちら
        </Link>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-gray-400">Powered by Musuhi</p>
        <p className="text-xs text-gray-500">あなたも大切な人へ『声の贈りもの』を届けませんか？</p>
      </div>
    </div>
  );
}
