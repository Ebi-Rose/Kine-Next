"use client";
import { useCallback, useRef, useState } from "react";

// iOS Safari doesn't support continuous: true — it stops after ~5-10s.
// This hook restarts recognition automatically, concatenating results,
// so it works across both desktop Chrome and iOS Safari PWA.

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useVoiceRecorder(onTranscript: (t: string) => void) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const accumulated = useRef("");
  const recogRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);

  const getSR = () => {
    if (typeof window === "undefined") return null;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return null; }
    return SR;
  };

  const startSession = useCallback((SR: any) => {
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-GB";

    r.onresult = (e: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (finalChunk) accumulated.current += (accumulated.current ? " " : "") + finalChunk.trim();
      onTranscript((accumulated.current + (interim ? " " + interim : "")).trim());
    };

    r.onend = () => {
      if (shouldRestartRef.current) {
        const SR2 = getSR();
        if (SR2) startSession(SR2);
      }
    };

    r.onerror = (e: any) => {
      if (e.error === "no-speech" && shouldRestartRef.current) {
        const SR2 = getSR();
        if (SR2) startSession(SR2);
      }
    };

    try { r.start(); } catch { /* ignore */ }
    recogRef.current = r;
  }, [onTranscript]);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) return;
    accumulated.current = "";
    onTranscript("");
    shouldRestartRef.current = true;
    setRecording(true);
    startSession(SR);
  }, [startSession, onTranscript]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    setRecording(false);
    try { recogRef.current?.stop(); } catch { /* ignore */ }
    return accumulated.current;
  }, []);

  return { recording, supported, start, stop };
}
