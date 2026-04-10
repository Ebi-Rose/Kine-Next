"use client";

import { useEffect } from "react";

export default function ForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;
    const hadLight = html.classList.contains("light");
    html.classList.add("light");
    return () => {
      if (!hadLight) html.classList.remove("light");
    };
  }, []);
  return null;
}
