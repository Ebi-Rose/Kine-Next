"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { installFeedbackContext, trackRoute } from "@/lib/feedback-context";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import ToastContainer from "@/components/Toast";
import SyncProvider from "@/components/SyncProvider";
import GuideButton from "@/components/GuideButton";
import GuideDrawer from "@/components/GuideDrawer";
import FeedbackButton from "@/components/FeedbackButton";
import FeedbackSheet from "@/components/FeedbackSheet";
import InactivityGuard from "@/components/InactivityGuard";
import OfflineIndicator from "@/components/OfflineIndicator";
import DevOverlay from "@/components/DevOverlay";
import PwaHead from "@/components/PwaHead";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => { installFeedbackContext(); }, []);
  useEffect(() => { trackRoute(pathname); }, [pathname]);
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <header className="mx-auto max-w-[var(--container-max)] px-6 pt-4 pb-0" style={{ paddingLeft: 'max(24px, env(safe-area-inset-left))', paddingRight: 'max(24px, env(safe-area-inset-right))' }}>
          <span className="font-display text-lg tracking-widest">
            <span className="text-accent">K</span>
            <span className="text-text">INĒ</span>
          </span>
        </header>
        <main id="main-content" className="mx-auto max-w-[var(--container-max)] px-6 pb-20 pt-3" style={{ paddingLeft: 'max(24px, env(safe-area-inset-left))', paddingRight: 'max(24px, env(safe-area-inset-right))' }}>
          {children}
        </main>
        {pathname !== "/app/onboarding" && <BottomNav />}
        <ToastContainer />
        <SyncProvider />
        <OfflineIndicator />
        <InactivityGuard />
        <GuideButton onClick={() => setGuideOpen(true)} />
        <GuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} route={pathname} />
        <FeedbackButton onClick={() => setFeedbackOpen(true)} />
        <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        <DevOverlay />
        <PwaHead />
        <ServiceWorkerRegistrar />
      </div>
    </AuthGuard>
  );
}
