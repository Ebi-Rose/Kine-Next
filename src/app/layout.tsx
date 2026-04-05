import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import SplashDismiss from "@/components/SplashDismiss";
import "./globals.css";
import "./custom.css";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KINĒ",
    template: "%s — KINĒ",
  },
  description: "Intelligent training — so you don't have to figure it out alone.",
};

export const viewport: Viewport = {
  themeColor: "#13110f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <div
          id="splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#13110f",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes splash-pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 1; }
                }
                @keyframes splash-exit {
                  to { opacity: 0; pointer-events: none; }
                }
                #splash .splash-mark {
                  font-family: "Cormorant Garamond", serif;
                  font-weight: 300;
                  font-size: 40px;
                  letter-spacing: 0.25em;
                  animation: splash-pulse 2s ease-in-out infinite;
                }
                #splash .splash-bar {
                  width: 48px;
                  height: 2px;
                  margin-top: 20px;
                  border-radius: 1px;
                  background: #c49098;
                  opacity: 0.5;
                  animation: splash-pulse 2s ease-in-out infinite;
                  animation-delay: 0.3s;
                }
                #splash.splash-exit {
                  animation: splash-exit 0.4s ease forwards;
                }
              `,
            }}
          />
          <div className="splash-mark">
            <span style={{ color: "#c49098" }}>K</span>
            <span style={{ color: "#f0ebe6" }}>INĒ</span>
          </div>
          <div className="splash-bar" />
        </div>
        {/* Clean up stale service workers on non-app pages */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && !['/app','/login','/pricing'].some(function(p){return location.pathname.startsWith(p)})) {
                navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister()})});
                if (caches) caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})});
              }
            `,
          }}
        />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <SplashDismiss />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
