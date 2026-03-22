"use client";

import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import ToastContainer from "@/components/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg">
        <main className="mx-auto max-w-[var(--container-max)] px-5 pb-20 pt-6">
          {children}
        </main>
        <BottomNav />
        <ToastContainer />
      </div>
    </AuthGuard>
  );
}
