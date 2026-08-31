const COUNT = 25;

export function lipSrc(i: number): string {
  const n = ((i % COUNT) + COUNT) % COUNT;
  return `/lips/lip-${String(n + 1).padStart(2, "0")}.png`;
}

export function LipsMark({ className, i = 0 }: { className?: string; i?: number }) {
  return <img src={lipSrc(i)} alt="" className={className} draggable={false} />;
}
