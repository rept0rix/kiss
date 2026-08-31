import { useEffect, useState } from "react";

export function useTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onOrient(e: DeviceOrientationEvent) {
      const g = e.gamma ?? 0;
      const b = e.beta ?? 0;
      setTilt({
        x: Math.max(-1, Math.min(1, g / 28)),
        y: Math.max(-1, Math.min(1, (b - 45) / 32)),
      });
    }
    function onMove(e: PointerEvent) {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setTilt({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
    }
    window.addEventListener("deviceorientation", onOrient);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  function request() {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE.requestPermission === "function") {
      void DOE.requestPermission().catch(() => undefined);
    }
  }

  return { tilt, request };
}
