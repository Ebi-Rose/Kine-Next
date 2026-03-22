"use client";

import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import ToastContainer from "@/components/Toast";
import SyncProvider from "@/components/SyncProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg">
        <main className="mx-auto max-w-[var(--container-max)] px-6 pb-20 pt-6" style={{ paddingLeft: 'max(24px, env(safe-area-inset-left))', paddingRight: 'max(24px, env(safe-area-inset-right))' }}>
          {children}
        </main>
        <BottomNav />
        <ToastContainer />
        <SyncProvider />
      </div>
    </AuthGuard>
  );
}
