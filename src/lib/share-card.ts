// ── PR Share Card ──
// Canvas-rendered share card → blob, shared via Web Share API or downloaded.

interface SharePR {
  name: string;
  weight: number;
  reps: number;
  prev?: number;
  weekNum: number;
  totalSessions: number;
}

export async function renderShareCard(pr: SharePR): Promise<Blob> {
  const dpr = window.devicePixelRatio || 2;
  const W = 360;
  const H = 540;
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, "#1a1a1a");
  bg.addColorStop(1, "#0d0d0d");
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.fill();

  // ── Subtle radial glow ──
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.35, 0, W * 0.3, H * 0.35, W * 0.8);
  glow.addColorStop(0, "rgba(196,144,152,0.06)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent line ──
  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, "#c49098");
  accent.addColorStop(1, "#d4a0a8");
  ctx.fillStyle = accent;
  roundRectTop(ctx, 0, 0, W, 3, 16);
  ctx.fill();

  // ── Content ──
  const centerY = H / 2 - 30;

  // Badge
  ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillStyle = "#c49098";
  ctx.textAlign = "center";
  ctx.fillText("NEW PERSONAL RECORD", W / 2, centerY - 80);

  // Exercise name
  ctx.font = "30px Bebas Neue, sans-serif";
  ctx.fillStyle = "#e8e0dc";
  ctx.letterSpacing = "1px";
  ctx.fillText(pr.name.toUpperCase(), W / 2, centerY - 40);

  // Weight
  ctx.font = "64px Bebas Neue, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.letterSpacing = "0px";
  const weightText = pr.weight + "kg";
  const delta = pr.prev ? "+" + (pr.weight - pr.prev) + "kg" : "";

  if (delta) {
    const weightWidth = ctx.measureText(weightText).width;
    const totalWidth = weightWidth + 12 + 60;
    const startX = W / 2 - totalWidth / 2 + weightWidth / 2;
    ctx.fillText(weightText, startX, centerY + 30);
    ctx.font = "500 18px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#c49098";
    ctx.fillText(delta, startX + weightWidth / 2 + 42, centerY + 30);
  } else {
    ctx.fillText(weightText, W / 2, centerY + 30);
  }

  // Divider
  ctx.fillStyle = "rgba(196,144,152,0.3)";
  ctx.fillRect(W / 2 - 20, centerY + 55, 40, 1);

  // Stats line
  const statsY = centerY + 80;
  ctx.font = "300 12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.textAlign = "center";
  ctx.fillText(`Week ${pr.weekNum}  ·  ${pr.totalSessions} sessions`, W / 2, statsY);

  // Branding
  ctx.textAlign = "right";
  ctx.font = "300 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#555555";
  const brandY = H - 28;
  ctx.fillText("trained with", W - 80, brandY);
  ctx.font = "16px Bebas Neue, sans-serif";
  ctx.fillStyle = "#777777";
  ctx.letterSpacing = "2px";
  ctx.fillText("KINE", W - 28, brandY);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

export async function sharePR(pr: SharePR): Promise<void> {
  try {
    const blob = await renderShareCard(pr);
    const file = new File([blob], "kine-pr.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `New PR: ${pr.name} ${pr.weight}kg`,
        text: `${pr.name} - ${pr.weight}kg. Trained with Kine.`,
      });
    } else if (navigator.share) {
      await navigator.share({
        title: `New PR: ${pr.name} ${pr.weight}kg`,
        text: `${pr.name} - ${pr.weight}kg. Trained with Kine.`,
        url: "https://kinefit.app",
      });
    } else {
      // Desktop fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kine-pr.png";
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") console.error("Share failed:", err);
  }
}

// ── Canvas helpers ──

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
