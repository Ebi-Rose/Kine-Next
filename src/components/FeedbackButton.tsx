"use client";

interface FeedbackButtonProps {
  onClick: () => void;
}

export default function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[140px] right-[68px] z-[80] flex items-center gap-1.5 rounded-full border border-accent/40 bg-bg/90 backdrop-blur-sm px-3 py-1.5 shadow-lg transition-all hover:border-accent hover:scale-105 active:scale-95"
      aria-label="Send feedback"
      title="Send feedback"
    >
      <span className="text-[10px] font-medium text-accent tracking-wider">FEEDBACK</span>
    </button>
  );
}
