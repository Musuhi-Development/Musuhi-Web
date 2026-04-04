"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, Gift, MessageSquare, User, Mic } from "lucide-react";
import { clsx } from "clsx";
import RecordingModal from "@/components/RecordingModal";

export default function FooterNav() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

          <button
            onClick={() => setIsModalOpen(true)}
            className="mx-auto flex items-center justify-center w-14 h-14 bg-[#2A5CAA] text-white rounded-full shadow-xl hover:bg-[#1F4580] transition-all"
            aria-label="録音"
          >
            <Mic size={26} fill="white" />
          </button>

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
