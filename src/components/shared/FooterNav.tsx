"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, Gift, MessageSquare, User } from "lucide-react";
import { clsx } from "clsx";

export default function FooterNav() {
  const pathname = usePathname();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white pb-safe shadow-lg z-40 border-t border-gray-100">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center flex-1 h-full text-xs gap-1 transition-all",
                isActive 
                  ? "text-[#2A5CAA]" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={clsx(
                "flex items-center justify-center w-12 h-12 rounded-2xl transition-all",
                isActive 
                  ? "bg-[#2A5CAA] text-white shadow-md" 
                  : ""
              )}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isActive && (
                <span className="font-medium text-[10px]">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
