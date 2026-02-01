"use client";

import Link from "next/link";
import { Mic } from "lucide-react";

export default function FloatingActionButton() {
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Link
        href="/record"
        className="flex items-center justify-center w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors"
        aria-label="録音"
      >
        <Mic size={28} />
      </Link>
    </div>
  );
}
