"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hapticLight } from "@/lib/haptics";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: "⬡" },
  { href: "/app/progress", label: "Progress", icon: "↗" },
  { href: "/app/profile", label: "Profile", icon: "◯" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-bg/92 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-around py-1.5 pb-[max(8px,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive =
            href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => hapticLight()}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-5 py-1.5 min-h-[44px] justify-center text-[10px] tracking-[0.5px] transition-colors duration-200 ${
                isActive ? "text-accent" : "text-muted hover:text-muted2"
              }`}
            >
              <span className="text-[17px] leading-none">{icon}</span>
              <span className="font-light">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
