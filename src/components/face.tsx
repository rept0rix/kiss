import { initials, nameHue } from "@/lib/contacts";

export function Face({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string | null;
  className?: string;
}) {
  if (photo) return <img src={photo} alt="" className={className} />;
  return (
    <span
      className={`face-init ${className ?? ""}`}
      style={{ backgroundColor: `hsl(${nameHue(name || "x")} 42% 20%)` }}
    >
      {initials(name || "?")}
    </span>
  );
}
