import { useRef, type ChangeEvent } from "react";
import { Camera, Images } from "lucide-react";

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
  if (!open) return null;

  function take(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
    onClose();
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet photo-sheet" role="dialog" aria-label="Add photo" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-xl">Your face</p>
        <p className="mt-1 text-xs text-muted">Camera or the photos on this phone.</p>
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
        <button type="button" className="photo-choice" onClick={() => cam.current?.click()}>
          <Camera size={18} />
          Take photo
        </button>
        <button type="button" className="photo-choice" onClick={() => lib.current?.click()}>
          <Images size={18} />
          Photo library
        </button>
        <button type="button" className="sheet-x mt-2 w-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
