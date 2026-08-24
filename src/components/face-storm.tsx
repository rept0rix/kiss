import type { ReactNode } from "react";
import { LipsMark } from "./lips-mark";

const FACES = [
  "/faces/face-01.jpg",
  "/faces/face-02.jpg",
  "/faces/face-03.jpg",
  "/faces/face-04.jpg",
  "/faces/face-05.jpg",
  "/faces/face-06.jpg",
  "/faces/face-07.jpg",
  "/faces/face-08.jpg",
  "/faces/face-09.jpg",
  "/faces/face-10.jpg",
];

export function FaceStorm({ children }: { children?: ReactNode }) {
  return (
    <div className="storm">
      {FACES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`storm-face storm-face-${i + 1}`}
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <LipsMark key={i} className={`fly-kiss fly-kiss-${i + 1}`} />
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
