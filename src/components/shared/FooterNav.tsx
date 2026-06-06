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

  const navItems = [
    {
      label: "アルバム", // Home - Voice Album
      href: "/home",
      icon: BookHeart,
    },
    {
      label: "ギフト", // Voice Gift
      href: "/gift",
      icon: Gift,
    },
    {
      label: "ボード", // Voice Board
      href: "/board",
      icon: MessageSquare,
    },
    {
      label: "マイページ", // My Page
      href: "/mypage",
      icon: User,
    },
  ];

  if (!user) return null;

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white pb-safe shadow-lg z-40 border-t border-gray-100">
        <div className="grid grid-cols-5 items-center px-2 py-2">
          {leftItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center text-xs gap-1 transition-all",
                  isActive
                    ? "text-[#2A5CAA]"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div
                  className={clsx(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all",
                    isActive ? "text-[#2A5CAA]" : ""
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={clsx("font-medium text-[10px]", isActive ? "text-[#2A5CAA]" : "text-gray-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="relative flex items-center justify-center">
            {showPrompt && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-60 rounded-xl border border-blue-100 bg-white shadow-lg px-3 py-2.5 z-50">
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
                  aria-label="閉じる"
                >
                  <X size={13} />
                </button>
                <p className="text-[12px] text-gray-800 pr-4 leading-relaxed">{question}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="mx-auto flex items-center justify-center w-14 h-14 bg-[#2A5CAA] text-white rounded-full shadow-xl hover:bg-[#1F4580] transition-all"
              aria-label="録音"
            >
              <img src="/icons/mic.png" alt="" className="w-full h-full object-contain" />
            </button>
          </div>

          {rightItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center text-xs gap-1 transition-all",
                  isActive
                    ? "text-[#2A5CAA]"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div
                  className={clsx(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all",
                    isActive ? "text-[#2A5CAA]" : ""
                  )}
                >
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
