"use client";

import { useEffect } from "react";

export default function SplashDismiss() {
  useEffect(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;

    // Mark session so splash won't show on subsequent navigations
    try { sessionStorage.setItem("kine_loaded", "1"); } catch {}

    splash.classList.add("splash-exit");
    const fallback = setTimeout(() => splash.remove(), 2000);
    splash.addEventListener(
      "animationend",
      () => {
        clearTimeout(fallback);
        splash.remove();
      },
      { once: true },
    );
  }, []);

  return null;
}
