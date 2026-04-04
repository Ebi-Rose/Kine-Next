"use client";

import { useEffect } from "react";

/**
 * Injects PWA-related <head> tags (manifest, apple-web-app).
 * Only mount this on routes that should be part of the PWA experience
 * (login, pricing, /app/*) — not the marketing landing page.
 */
export default function PwaHead() {
  useEffect(() => {
    // Manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.json";
      document.head.appendChild(link);
    }

    // Apple meta tags
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const capable = document.createElement("meta");
      capable.name = "apple-mobile-web-app-capable";
      capable.content = "yes";
      document.head.appendChild(capable);
    }

    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const style = document.createElement("meta");
      style.name = "apple-mobile-web-app-status-bar-style";
      style.content = "black-translucent";
      document.head.appendChild(style);
    }

    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const title = document.createElement("meta");
      title.name = "apple-mobile-web-app-title";
      title.content = "Kinē";
      document.head.appendChild(title);
    }
  }, []);

  return null;
}
