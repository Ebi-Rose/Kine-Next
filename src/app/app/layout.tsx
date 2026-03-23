"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import ToastContainer from "@/components/Toast";
import SyncProvider from "@/components/SyncProvider";
import GuideButton from "@/components/GuideButton";
import GuideDrawer from "@/components/GuideDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg">
        <main className="mx-auto max-w-[var(--container-max)] px-6 pb-20 pt-6" style={{ paddingLeft: 'max(24px, env(safe-area-inset-left))', paddingRight: 'max(24px, env(safe-area-inset-right))' }}>
          {children}
        </main>
        <BottomNav />
        <ToastContainer />
        <SyncProvider />
        <GuideButton onClick={() => setGuideOpen(true)} />
        <GuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} route={pathname} />
      </div>
    </AuthGuard>
  );
}
