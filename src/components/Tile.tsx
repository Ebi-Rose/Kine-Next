import { hapticLight } from "@/lib/haptics";

interface TileProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Tile({
  children,
  selected = false,
  onClick,
  className = "",
}: TileProps) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onClick?.();
      }}
      className={`rounded-xl border px-4 py-3.5 text-left text-[13px] transition-all duration-200 ease-out ${
        selected
          ? "border-accent bg-accent-dim text-text shadow-[0_0_0_1px_rgba(196,144,152,0.3)]"
          : "border-border bg-surface text-muted2 hover:border-border-active hover:text-text hover:bg-surface2"
      } ${className}`}
    >
      {children}
    </button>
  );
}
