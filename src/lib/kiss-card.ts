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

    const glow = ctx.createRadialGradient(600, 300, 40, 600, 320, 520);
    glow.addColorStop(0, "#3a0a10");
    glow.addColorStop(0.55, "#120407");
    glow.addColorStop(1, "#070707");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 630);

    scatter(ctx);

    let done = false;
    ctx.fillStyle = "#e11d2e";
    ctx.font = "900 42px Archivo Black, Impact, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("KISS", 48, 70);

    const finish = () => {
      if (done) return;
      done = true;
      stamp(ctx, 742, 390, 1.35);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 92px Archivo Black, Impact, sans-serif";
      ctx.fillText("COME GET IT", 600, 560);
      ctx.fillStyle = "#e11d2e";
      ctx.font = "700 28px IBM Plex Sans, sans-serif";
      ctx.fillText("a kiss from me is waiting", 600, 602);
      resolve(canvas.toDataURL("image/jpeg", 0.55));
    };

    if (!photo) {
      emptyFace(ctx, name);
      finish();
      return;
    }

    const img = new Image();
    const paint = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(600, 268, 168, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const s = Math.min(img.width, img.height) || 1;
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 432, 100, 336, 336);
      ctx.restore();
      ctx.strokeStyle = "#e11d2e";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(600, 268, 168, 0, Math.PI * 2);
      ctx.stroke();
      finish();
    };
    img.onload = paint;
    img.onerror = () => {
      emptyFace(ctx, name);
      finish();
    };
    img.src = photo;
    window.setTimeout(() => {
      if (img.naturalWidth > 0) return;
      emptyFace(ctx, name);
      finish();
    }, 1800);
  });
}

function emptyFace(ctx: CanvasRenderingContext2D, name: string) {
  ctx.fillStyle = "#1a0a0c";
  ctx.beginPath();
  ctx.arc(600, 268, 168, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e11d2e";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 84px Archivo Black, sans-serif";
  ctx.textAlign = "center";
  const parts = name.trim().split(/\s+/);
  const ini = ((parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? "")).toUpperCase();
  ctx.fillText(ini, 600, 298);
}

function scatter(ctx: CanvasRenderingContext2D) {
  const lipsAt: Array<[number, number, number, number]> = [
    [130, 180, 0.7, -18],
    [980, 140, 0.85, 22],
    [90, 430, 0.55, 12],
    [1080, 380, 0.7, -10],
    [220, 90, 0.4, 30],
    [940, 500, 0.5, -24],
    [1060, 240, 0.45, 8],
  ];
  for (const [x, y, s, r] of lipsAt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((r * Math.PI) / 180);
    lips(ctx, 0, 0, s);
    ctx.restore();
  }
  ctx.fillStyle = "#e11d2e";
  const hearts: Array<[number, number, number]> = [
    [200, 300, 14],
    [1020, 300, 18],
    [160, 520, 11],
    [880, 80, 13],
    [740, 120, 9],
    [430, 80, 10],
  ];
  for (const [x, y, s] of hearts) heart(ctx, x, y, s);
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

function stamp(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.globalAlpha = 0.92;
  lips(ctx, 0, 0, s);
  ctx.restore();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.3);
  ctx.bezierCurveTo(r, -r * 0.6, r * 1.6, r * 0.4, 0, r * 1.35);
  ctx.bezierCurveTo(-r * 1.6, r * 0.4, -r, -r * 0.6, 0, r * 0.3);
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
      await navigator.share({ title: "Come get a kiss from me", text, files: [file] });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: "Come get a kiss from me", text });
      return;
    }
  } catch {
    /* cancelled */
  }
  window.open(waUrl, "_blank", "noopener,noreferrer");
}
