import { useEffect } from "react";

/** Keeps --kb in sync with the iOS/Android keyboard so sheets sit above it. */
export function useKeyboardInset(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const vv = window.visualViewport;
    const sync = () => {
      const kb = vv
        ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        : 0;
      document.documentElement.style.setProperty("--kb", `${Math.round(kb)}px`);
    };
    document.body.classList.add("sheet-open");
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      document.body.classList.remove("sheet-open");
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.documentElement.style.setProperty("--kb", "0px");
    };
  }, [active]);
}
