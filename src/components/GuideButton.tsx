"use client";

interface GuideButtonProps {
  onClick: () => void;
}

export default function GuideButton({ onClick }: GuideButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[13px] text-accent hover:bg-accent/25 active:scale-95 transition-all"
      aria-label="Open guide"
    >
      ?
    </button>
  );
}
