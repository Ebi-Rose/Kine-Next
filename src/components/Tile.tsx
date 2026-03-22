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
      onClick={onClick}
      className={`rounded-[var(--radius-default)] border px-4 py-3 text-left text-sm transition-all ${
        selected
          ? "border-accent bg-accent-dim text-text"
          : "border-border bg-surface text-muted2 hover:border-border-active hover:text-text"
      } ${className}`}
    >
      {children}
    </button>
  );
}
