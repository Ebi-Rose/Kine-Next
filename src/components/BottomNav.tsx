"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: "⬡" },
  { href: "/app/progress", label: "Progress", icon: "↗" },
  { href: "/app/profile", label: "Profile", icon: "◯" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive =
            href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                isActive ? "text-accent" : "text-muted2 hover:text-text"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
