import { useState } from "react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";

export function AccountChip() {
  const { user, isPending } = useCurrentUserState();
  const display = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-border" />;
  }
  if (!user) {
    return (
      <Link to="/login" className="text-sm font-medium text-fg underline-offset-4 hover:underline">
        In
      </Link>
    );
  }

  const label = display?.displayName ?? "You";
  return (
    <div className="flex items-center gap-2">
      {display?.profileImageUrl ? (
        <img src={display.profileImageUrl} alt="" className="size-9 rounded-full object-cover" />
      ) : (
        <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-medium text-primary-fg">
          {label.charAt(0)}
        </span>
      )}
      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        }}
        className="text-sm text-muted underline-offset-4 hover:underline disabled:opacity-50"
      >
        {signingOut ? "Out…" : "Out"}
      </button>
    </div>
  );
}
