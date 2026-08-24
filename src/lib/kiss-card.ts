export function buildKissCard(photo: string | null, name: string): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.fillStyle = "#070707";
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = "#e11d2e";
    ctx.font = "900 72px Archivo Black, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("I KISS YOU NOW", 600, 92);

    const finish = () => {
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 36px IBM Plex Sans, sans-serif";
      ctx.fillText("Come inside and get it.", 600, 560);
      lips(ctx, 780, 330, 1.15);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };

    if (!photo) {
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(600, 320, 168, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "900 84px Archivo Black, sans-serif";
      const parts = name.trim().split(/\s+/);
      const ini = ((parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? "")).toUpperCase();
      ctx.fillText(ini, 600, 350);
      finish();
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(600, 320, 168, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 432, 152, 336, 336);
      ctx.restore();
      ctx.strokeStyle = "#e11d2e";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(600, 320, 168, 0, Math.PI * 2);
      ctx.stroke();
      finish();
    };
    img.onerror = () => finish();
    img.src = photo;
  });
}

function lips(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#e11d2e";
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.bezierCurveTo(-28, -28, -8, -22, 0, -6);
  ctx.bezierCurveTo(8, -22, 28, -28, 40, 0);
  ctx.bezierCurveTo(28, 8, 10, 28, 0, 22);
  ctx.bezierCurveTo(-10, 28, -28, 8, -40, 0);
  ctx.fill();
  ctx.restore();
}

export function dataUrlToFile(dataUrl: string, name = "kiss.jpg"): File | null {
  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return null;
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: match[1] });
}

export async function shareKiss(text: string, card: string | null, waUrl: string): Promise<void> {
  const file = card ? dataUrlToFile(card) : null;
  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "I kiss you now", text, files: [file] });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: "I kiss you now", text });
      return;
    }
  } catch {
    /* cancelled */
  }
  window.open(waUrl, "_blank", "noopener,noreferrer");
}
