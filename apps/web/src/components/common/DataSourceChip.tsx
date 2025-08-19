"use client";
import { USE_MOCKS } from "@/lib/env-guard";

export function DataSourceChip({ className = "" }: { className?: string }) {
  const label = USE_MOCKS ? "Demo" : "Live";
  const tone = USE_MOCKS ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300";
  return (
    <span
      aria-label={`Data Source: ${label}`}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border border-white/10 ${tone} ${className}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" className="opacity-80">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
      </svg>
      Data Source: {label}
    </span>
  );
}
