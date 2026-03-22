import { ButtonHTMLAttributes } from "react";
import { hapticLight } from "@/lib/haptics";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  onClick,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-body font-medium transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-accent text-bg rounded-xl hover:brightness-110 shadow-[0_1px_3px_rgba(196,144,152,0.15)]",
    secondary:
      "bg-surface text-text border border-border rounded-[var(--radius-default)] hover:border-border-active hover:bg-surface2",
    ghost:
      "text-muted2 hover:text-text hover:bg-surface2 rounded-[var(--radius-default)]",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-[12px] tracking-[0.2px]",
    md: "px-5 py-2.5 text-[13px] tracking-[0.2px]",
    lg: "px-6 py-3.5 text-[15px] tracking-[0.3px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={(e) => {
        hapticLight();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
