import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Images, RefreshCw, X } from "lucide-react";
import { LipsMark } from "./lips-mark";

export function PhotoPick({
  open,
  onClose,
  onFile,
}: {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
}) {
  const cam = useRef<HTMLInputElement>(null);
  const lib = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liveCamera, setLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      stopLiveStream();
      setLiveCamera(false);
      setCameraError(null);
    }
  }, [open]);

  function stopLiveStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function startLiveCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cam.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 50);
    } catch {
      // Fallback directly to native camera input
      cam.current?.click();
    }
  }

  function snapSelfie() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = ((video.videoWidth || 480) - size) / 2;
    const sy = ((video.videoHeight || 480) - size) / 2;
    // Mirror horizontally for selfie
    ctx.translate(320, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
          stopLiveStream();
          onFile(file);
          onClose();
        }
      },
      "image/jpeg",
      0.75,
    );
  }

  function take(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      stopLiveStream();
      onFile(file);
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="sheet-scrim" onClick={() => { stopLiveStream(); onClose(); }}>
      <div className="sheet photo-sheet" role="dialog" aria-label="Add photo" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="font-display text-xl">Your Face</p>
          <button
            type="button"
            className="sheet-x"
            onClick={() => {
              stopLiveStream();
              onClose();
            }}
          >
            Close
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted">A kiss needs a face to blow kisses from.</p>

        {liveCamera ? (
          <div className="mt-3 flex flex-col items-center">
            <div className="relative w-56 h-56 rounded-full overflow-hidden border-2 border-primary shadow-lg bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <LipsMark className="w-16 h-16 text-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-3 w-full justify-center">
              <button
                type="button"
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-display text-base tracking-wider uppercase shadow-md active:scale-95 transition-transform"
                onClick={snapSelfie}
              >
                💋 Snap Kiss Selfie
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15"
                onClick={() => {
                  stopLiveStream();
                  setLiveCamera(false);
                }}
                title="Cancel Camera"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <input
              ref={(el) => {
                cam.current = el;
                if (el) el.setAttribute("capture", "user");
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={take}
            />
            <input ref={lib} type="file" accept="image/*" className="hidden" onChange={take} />
            <button
              type="button"
              className="photo-choice font-medium flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
              onClick={() => void startLiveCamera()}
            >
              <Camera size={18} />
              Live Selfie Camera
            </button>
            <button
              type="button"
              className="photo-choice font-medium flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
              onClick={() => lib.current?.click()}
            >
              <Images size={18} />
              Photo Library
            </button>
            <button
              type="button"
              className="photo-choice font-medium flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs text-muted hover:text-white transition-colors"
              onClick={() => cam.current?.click()}
            >
              <RefreshCw size={14} />
              Device Camera App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
