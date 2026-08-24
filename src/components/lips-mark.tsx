export function LipsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden>
      <path
        d="M8 22c6-10 14-14 24-14s18 4 24 14c-6 10-14 14-24 14S14 32 8 22Z"
        fill="currentColor"
      />
      <path
        d="M10 22c5-1 11 2 22 2s17-3 22-2"
        fill="none"
        stroke="var(--color-bg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
