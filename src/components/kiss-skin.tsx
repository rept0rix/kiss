import { cn } from "@/lib/utils";
import { isSkin, type SkinId } from "@/lib/kisses/ranks";

export function KissSkin({
  skin,
  className,
}: {
  skin?: string | null;
  className?: string;
}) {
  const id: SkinId = skin && isSkin(skin) ? skin : "classic";
  return (
    <svg viewBox="0 0 64 48" className={cn("kiss-skin", `skin-${id}`, className)} aria-hidden>
      {shape(id)}
    </svg>
  );
}

function shape(id: SkinId) {
  const lips = (
    <path d="M8 24c6-12 14-16 24-16s18 4 24 16c-6 12-14 16-24 16S14 36 8 24Z" fill="currentColor" />
  );
  const split = (
    <path
      d="M10 24c5-1 11 2 22 2s17-3 22-2"
      fill="none"
      stroke="var(--color-bg)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  );
  if (id === "gold") {
    return (
      <>
        {lips}
        {split}
        <circle cx="50" cy="10" r="3" fill="currentColor" />
        <circle cx="14" cy="12" r="2" fill="currentColor" />
      </>
    );
  }
  if (id === "pink") {
    return (
      <>
        <path d="M6 24c7-14 16-18 26-18s19 4 26 18c-7 14-16 18-26 18S13 38 6 24Z" fill="currentColor" />
        {split}
      </>
    );
  }
  if (id === "fire") {
    return (
      <>
        <path d="M20 12c2-8 8-10 12-4 4-8 12-4 12 4 8 0 12 8 8 14-4-2-8-2-12 2-4-6-12-6-16-2-4-4-10-6-12-8 2-4 6-6 8-6Z" fill="currentColor" opacity="0.85" />
        {lips}
        {split}
      </>
    );
  }
  if (id === "ice") {
    return (
      <>
        {lips}
        <path d="M32 4 36 12 32 10 28 12Z" fill="currentColor" />
        <path d="M8 16 14 18 10 20Z" fill="currentColor" />
        <path d="M56 16 50 18 54 20Z" fill="currentColor" />
      </>
    );
  }
  if (id === "venom") {
    return (
      <>
        <path d="M8 22c6-10 14-14 24-14s18 4 24 14c-4 6-10 12-16 16l-8-8-8 8c-6-4-12-10-16-16Z" fill="currentColor" />
        {split}
      </>
    );
  }
  if (id === "royal") {
    return (
      <>
        <path d="M16 12 22 4 32 10 42 4 48 12 32 14Z" fill="currentColor" />
        {lips}
        {split}
      </>
    );
  }
  if (id === "void") {
    return (
      <path
        d="M8 24c6-12 14-16 24-16s18 4 24 16c-6 12-14 16-24 16S14 36 8 24Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
    );
  }
  if (id === "myth") {
    return (
      <>
        <path d="M12 20c5-10 12-13 20-13s15 3 20 13c-5 10-12 13-20 13S17 30 12 20Z" fill="currentColor" opacity="0.55" />
        {lips}
        {split}
      </>
    );
  }
  if (id === "god") {
    return (
      <>
        <path d="M32 2 34 10 32 8 30 10Z" fill="currentColor" />
        {lips}
        {split}
        <circle cx="32" cy="24" r="3" fill="var(--color-bg)" />
      </>
    );
  }
  if (id === "eternal") {
    return (
      <>
        <circle cx="32" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
        {lips}
        {split}
      </>
    );
  }
  if (id === "immortal") {
    return (
      <>
        <path d="M32 0 36 12 32 10 28 12Z" fill="currentColor" />
        <path d="M4 24 16 20 14 24 16 28Z" fill="currentColor" />
        <path d="M60 24 48 20 50 24 48 28Z" fill="currentColor" />
        {lips}
        {split}
      </>
    );
  }
  return (
    <>
      {lips}
      {split}
    </>
  );
}
