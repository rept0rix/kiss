import { useState } from "react";
import { sendKiss, sendRandomKiss } from "@/lib/kisses/server";
import type { Friend } from "@/lib/kisses/types";
import { AvatarMark } from "./avatar-mark";
import { Button } from "./ui/button";

export function SendPanel({
  friends,
  randomRemaining,
  onSent,
}: {
  friends: Friend[];
  randomRemaining: number;
  onSent: (payload: { fromName: string; kind: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fire(action: () => Promise<{ kind: string }>, fromName: string) {
    setBusy(true);
    setError(null);
    void action()
      .then((res) => onSent({ fromName, kind: res.kind }))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Missed"))
      .finally(() => setBusy(false));
  }

  return (
    <section className="space-y-4">
      <Button
        size="lg"
        className="h-16 w-full rounded-xl font-display text-xl tracking-tight"
        disabled={busy || randomRemaining < 1}
        onClick={() =>
          fire(() => sendRandomKiss({ data: "warm" }).then((r) => ({ kind: r.kind })), "You")
        }
      >
        {randomRemaining < 1 ? "Stranger kiss used" : "Kiss a stranger"}
      </Button>

      {friends.length > 0 ? (
        <div>
          <p className="mb-3 text-xs uppercase tracking-wide text-muted">Tap a face</p>
          <ul className="grid grid-cols-3 gap-3">
            {friends.map((f) => (
              <li key={f.userId}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    fire(
                      () =>
                        sendKiss({ data: { toUserId: f.userId, kind: "warm" } }).then((r) => ({
                          kind: r.kind,
                        })),
                      "You",
                    )
                  }
                  className="flex w-full flex-col items-center gap-2"
                >
                  <AvatarMark name={f.displayName} hue={f.avatarHue} size="lg" />
                  <span className="w-full truncate text-xs">{f.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted">Find someone on People, or throw a stranger kiss.</p>
      )}

      {error ? <p className="text-sm text-primary">{error}</p> : null}
    </section>
  );
}
