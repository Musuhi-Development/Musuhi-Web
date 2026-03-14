"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  showBackButton?: boolean;
  actionButton?: React.ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  showBackButton = false,
  actionButton,
  className = "",
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className={`sticky top-0 bg-white z-30 border-b ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-6"></div>
        )}

        <h1 className="text-xl font-bold text-gray-800">{title}</h1>

        {actionButton ? (
          <div>{actionButton}</div>
        ) : (
          <div className="w-6"></div>
        )}
      </div>
    </header>
  );
}
