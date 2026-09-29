import { useEffect, useRef, useState } from "react";
import { resolveQrCode } from "@/lib/store/server";
import { isValidPhone, phoneDigits } from "@/lib/contacts";
import { Button } from "./ui/button";

export function QrScanner({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (result: { phone: string; name: string }) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      // Cleanup camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setError(null);
      setManualCode("");
      return;
    }
    // Try to open camera and scan via barcode detection API
    let gone = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (gone) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        // Use BarcodeDetector if available
        if ("BarcodeDetector" in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
          const tick = async () => {
            if (gone || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                const text = codes[0].rawValue as string;
                await handleCode(text);
                return;
              }
            } catch { /* ignore */ }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        } else {
          setError("Camera scanning not supported — enter code manually");
        }
      } catch {
        setError("Camera not available — enter code manually");
      }
    })();
    return () => {
      gone = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  async function handleCode(text: string) {
    // Extract the code from a URL like /k/{code} or raw code
    const match = text.match(/\/k\/([a-z0-9]{4,8})/i);
    const code = match ? match[1] : text.trim().toLowerCase().slice(0, 8);
    if (!/^[a-z0-9]{4,8}$/.test(code)) {
      setError("Not a KISS code");
      return;
    }
    const result = await resolveQrCode({ data: code }).catch(() => null);
    if (result && isValidPhone(result.phone)) {
      onScan({ phone: phoneDigits(result.phone), name: result.name });
    } else {
      setError("Nobody found for that code");
    }
  }

  if (!open) return null;

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Scan QR" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="font-display text-xl">Scan QR</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <div className="qr-scan-area mt-3">
          {error ? (
            <p className="qr-hint">{error}</p>
          ) : null}
          <video
            ref={videoRef}
            playsInline
            muted
            className="qr-video"
          />
        </div>
        <div className="qr-manual mt-3">
          <p className="text-xs text-muted">Or enter the code manually</p>
          <div className="qr-manual-row">
            <input
              className="qr-manual-input"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
              placeholder="e.g. abc12"
              maxLength={8}
            />
            <Button
              size="sm"
              disabled={manualCode.length < 4}
              onClick={() => void handleCode(manualCode)}
            >
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
