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
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white pb-safe pt-2 h-16 z-40">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full text-xs gap-1",
                isActive ? "text-orange-500" : "text-gray-500 hover:text-orange-400"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
