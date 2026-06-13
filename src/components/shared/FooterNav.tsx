"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, Gift, MessageSquare, User, X } from "lucide-react";
import { clsx } from "clsx";
import RecordingModal from "@/components/RecordingModal";
import { useUser } from "@/hooks/useUser";
import { getDailyQuestion } from "@/lib/daily-question";

const DISMISS_KEY_PREFIX = "musuhi-daily-question-dismissed";

function getTodayKey(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${DISMISS_KEY_PREFIX}:${jst.toISOString().slice(0, 10)}`;
}

const navItems = [
  { label: "アルバム", href: "/home", icon: BookHeart },
  { label: "ギフト",   href: "/gift", icon: Gift },
  { label: "ボード",   href: "/board", icon: MessageSquare },
  { label: "マイページ", href: "/mypage", icon: User },
];

export default function FooterNav() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const [question] = useState<string>(() => getDailyQuestion());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setShowPrompt(false);
      return;
    }
    const dismissed = localStorage.getItem(getTodayKey()) === "1";
    setShowPrompt(!dismissed);
  }, [user?.id]);

  const dismissPrompt = () => {
    localStorage.setItem(getTodayKey(), "1");
    setShowPrompt(false);
  };

  if (!user) return null;

  const leftItems  = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <>
      {/* safe-area-inset-bottom を inline style で確実に適用 */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-40 border-t border-gray-100 overflow-visible"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* flex + h-[68px] で全列が確実に 68px 高さを共有 */}
        <div className="flex h-[68px] px-2">

          {/* ── 左 2 項目 ── */}
          {leftItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
                  isActive ? "text-[#2A5CAA]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={clsx("font-medium text-[10px]", isActive ? "text-[#2A5CAA]" : "text-gray-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* ── 中央マイク ── */}
          <div className="flex-1 relative flex flex-col items-center justify-end pb-1.5 overflow-visible">
            {/* 吹き出しプロンプト */}
            {showPrompt && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-60 rounded-xl border border-blue-100 bg-[#EBF2FF] shadow-lg px-3 py-2.5 z-50">
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
                  aria-label="閉じる"
                >
                  <X size={13} />
                </button>
                <p className="text-[12px] text-gray-800 text-center leading-relaxed">{question}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#EBF2FF]" />
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="mic-button flex flex-col items-center gap-0"
              aria-label="録音"
            >
              {/* PNG下部の透明余白(~30px)をクリップし、テキストをマイク実体の直下に配置 */}
              <div className="w-28 overflow-hidden" style={{ height: "84px" }}>
                <img src="/icons/mic1.png" alt="" className="w-28 h-28 object-contain" />
              </div>
              <span className="font-medium text-[10px] text-gray-400" style={{ marginTop: 0 }}>気持ちを残す</span>
            </button>
          </div>

          {/* ── 右 2 項目 ── */}
          {rightItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
                  isActive ? "text-[#2A5CAA]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={clsx("font-medium text-[10px]", isActive ? "text-[#2A5CAA]" : "text-gray-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

        </div>
      </nav>

      <RecordingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
