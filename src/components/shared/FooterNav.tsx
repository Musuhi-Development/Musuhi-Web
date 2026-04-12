"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, Gift, MessageSquare, User, Mic, X } from "lucide-react";
import { clsx } from "clsx";
import RecordingModal from "@/components/RecordingModal";
import { useUser } from "@/hooks/useUser";

type JournalingPrompt = {
  headline: string;
  message: string;
  recordingText: string;
  source?: string;
};

const LOGIN_SESSION_STORAGE_KEY = "musuhi-login-session-id";
const PROMPT_DISMISS_PREFIX = "musuhi-recording-prompt-dismissed";

export default function FooterNav() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const [prompt, setPrompt] = useState<JournalingPrompt | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setPrompt(null);
      setShowPrompt(false);
      return;
    }

    const loginSessionId = localStorage.getItem(LOGIN_SESSION_STORAGE_KEY) || "default";
    const dismissKey = `${PROMPT_DISMISS_PREFIX}:${loginSessionId}`;

    if (localStorage.getItem(dismissKey) === "1") {
      setShowPrompt(false);
      return;
    }

    let isMounted = true;

    fetch("/api/journaling/prompt", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load prompt");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setPrompt({
          headline: data.headline || "こんなことを録音してみませんか？",
          message: data.message || "今日のあなたの気持ちを声にしてみよう",
          recordingText: data.recordingText || "今日いちばん心に残ったこと",
          source: data.source,
        });
        setShowPrompt(true);
      })
      .catch((error) => {
        console.error("Failed to fetch journaling prompt:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const dismissPromptForThisLogin = () => {
    const loginSessionId = localStorage.getItem(LOGIN_SESSION_STORAGE_KEY) || "default";
    const dismissKey = `${PROMPT_DISMISS_PREFIX}:${loginSessionId}`;
    localStorage.setItem(dismissKey, "1");
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
            {showPrompt && prompt && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 rounded-xl border border-blue-100 bg-white shadow-lg p-3 z-50">
                <button
                  type="button"
                  onClick={dismissPromptForThisLogin}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  aria-label="閉じる"
                >
                  <X size={14} />
                </button>
                <p className="text-[11px] font-bold text-[#2A5CAA] pr-4">{prompt.headline}</p>
                <p className="text-[11px] text-gray-700 mt-1 leading-relaxed">{prompt.message}</p>
                <p className="text-[11px] text-gray-600 mt-1">「{prompt.recordingText}」</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="mx-auto flex items-center justify-center w-14 h-14 bg-[#2A5CAA] text-white rounded-full shadow-xl hover:bg-[#1F4580] transition-all"
              aria-label="録音"
            >
              <Mic size={26} fill="white" />
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
