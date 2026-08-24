import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Inbox, Search, UserRound, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountChip } from "./account-chip";

const NAV = [
  { to: "/", label: "Throw", icon: Zap },
  { to: "/inbox", label: "Caught", icon: Inbox },
  { to: "/friends", label: "People", icon: Search },
  { to: "/profile", label: "You", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg">
      <header className="app-header flex items-center justify-between px-4 pb-3">
        <Link to="/" className="font-display text-2xl tracking-tight text-fg">
          KISS
        </Link>
        <AccountChip />
      </header>
      <main className="flex-1 px-4 pb-28">{children}</main>
      <nav className="app-nav fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
