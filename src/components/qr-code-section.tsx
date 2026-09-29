import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/lib/qr";
import { getQrCode } from "@/lib/store/server";
import { publicOrigin } from "@/lib/share";
import { Button } from "./ui/button";

export function QrCodeSection({
  phone,
  name,
}: {
  phone: string;
  name: string;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) return;
    let gone = false;
    void (async () => {
      setLoading(true);
      const { code } = await getQrCode({ data: { phone, name } }).catch(() => ({ code: null }));
      if (gone) return;
      setCode(code);
      if (code) {
        const origin = publicOrigin() ?? "";
        const url = `${origin}/k/${code}`;
        const img = await generateQrDataUrl(url, 220);
        if (!gone) setQrUrl(img);
      }
      setLoading(false);
    })();
    return () => { gone = true; };
  }, [phone, name]);

  function onShare() {
    if (!code) return;
    const origin = publicOrigin() ?? "";
    const url = `${origin}/k/${code}`;
    const text = `Come get a kiss from me on KISS`;
    if (navigator.share) {
      void navigator.share({ title: "KISS", text, url }).catch(() => undefined);
    } else {
      void navigator.clipboard?.writeText(`${text}\n${url}`).catch(() => undefined);
    }
  }

  if (loading) {
    return (
      <div className="qr-section">
        <div className="qr-loading">Generating…</div>
      </div>
    );
  }

  return (
    <div className="qr-section">
      <p className="catch-pass-label">Your QR code</p>
      {qrUrl ? (
        <div className="qr-display">
          <img src={qrUrl} alt="Your KISS QR code" className="qr-img" />
          <p className="qr-hint">Scan to kiss you</p>
        </div>
      ) : (
        <p className="qr-hint">Could not generate QR</p>
      )}
      <Button size="sm" className="mt-3 w-full" onClick={onShare}>
        Share
      </Button>
    </div>
  );
}
