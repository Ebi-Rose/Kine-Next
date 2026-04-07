"use client";

interface FeedbackButtonProps {
  onClick: () => void;
}

export default function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-[60px] z-[80] w-[44px] h-[44px] rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[16px] text-accent hover:bg-accent/25 active:scale-95 transition-all"
      aria-label="Send feedback"
      title="Send feedback"
    >
      ✦
    </button>
  );
}
