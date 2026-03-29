"use client";

interface GuideButtonProps {
  onClick: () => void;
}

export default function GuideButton({ onClick }: GuideButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-[80] w-[44px] h-[44px] rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[15px] text-accent hover:bg-accent/25 active:scale-95 transition-all"
      aria-label="Open guide"
    >
      ?
    </button>
  );
}
