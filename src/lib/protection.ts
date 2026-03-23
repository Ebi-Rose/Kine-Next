// ── Production Protection ──
// Prevents casual copying/inspection in production

export function enableProtection() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;

  // Disable right-click context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Disable text selection on non-input elements
  document.addEventListener("selectstart", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
    e.preventDefault();
  });

  // Block common DevTools shortcuts
  document.addEventListener("keydown", (e) => {
    // F12
    if (e.key === "F12") { e.preventDefault(); return; }
    // Ctrl+Shift+I / Cmd+Option+I
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") { e.preventDefault(); return; }
    // Ctrl+Shift+J / Cmd+Option+J
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") { e.preventDefault(); return; }
    // Ctrl+U / Cmd+U (view source)
    if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); return; }
  });
}
