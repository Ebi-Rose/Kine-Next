"use client";

import { useEffect } from "react";

export default function SplashDismiss() {
  useEffect(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    splash.classList.add("splash-exit");
    splash.addEventListener("animationend", () => splash.remove(), {
      once: true,
    });
  }, []);

  return null;
}
