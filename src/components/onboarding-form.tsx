import { useState } from "react";
import { upsertProfile } from "@/lib/kisses/server";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function OnboardingForm({
  initialHandle = "",
  initialName = "",
  initialRandom = true,
  onSaved,
}: {
  initialHandle?: string;
  initialName?: string;
  initialRandom?: boolean;
  onSaved?: () => void;
}) {
  const [handle, setHandle] = useState(initialHandle);
  const [displayName, setDisplayName] = useState(initialName);
  const [openToRandom, setOpenToRandom] = useState(initialRandom);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        void upsertProfile({
          data: { handle, displayName, openToRandom },
        })
          .then(() => onSaved?.())
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Could not save");
          })
          .finally(() => setBusy(false));
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={32} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Handle</span>
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase())}
          placeholder="smooch"
          maxLength={20}
          required
        />
      </label>
      <label className="flex items-start gap-3 rounded-lg border border-border bg-elevated p-4">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          checked={openToRandom}
          onChange={(e) => setOpenToRandom(e.target.checked)}
        />
        <span>
          <span className="block text-sm font-medium">Catch stranger kisses</span>
          <span className="text-xs text-muted">One random hit a day, from anyone who opted in.</span>
        </span>
      </label>
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <Button type="submit" disabled={busy} size="lg">
        {busy ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
