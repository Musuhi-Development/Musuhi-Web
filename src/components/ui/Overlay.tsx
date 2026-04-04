"use client";

import { clsx } from "clsx";
import { forwardRef, ReactNode } from "react";

type ScreenOverlayProps = {
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
};

type InlineOverlayProps = {
  className?: string;
  children?: ReactNode;
};

export const ScreenOverlay = forwardRef<HTMLDivElement, ScreenOverlayProps>(function ScreenOverlay(
  { className, onClick, children },
  ref
) {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={clsx("fixed inset-0 bg-black/35 backdrop-blur-[1px]", className)}
    >
      {children}
    </div>
  );
});

export const InlineOverlay = forwardRef<HTMLDivElement, InlineOverlayProps>(function InlineOverlay(
  { className, children },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx("absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center", className)}
    >
      {children}
    </div>
  );
});
