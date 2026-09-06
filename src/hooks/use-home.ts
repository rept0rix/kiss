import { useQuery } from "@tanstack/react-query";
import { getHome, phoneInbox, phoneStats } from "@/lib/kisses/server";
import { isPhoneIdentity } from "@/lib/phone";
import { queryClient } from "@/lib/query-client";

export const HOME_KEY = ["home"] as const;
export const PHONE_INBOX_KEY = ["phone-inbox"] as const;
export const PHONE_STATS_KEY = ["phone-stats"] as const;

export function useHome(enabled = true) {
  return useQuery({
    queryKey: HOME_KEY,
    queryFn: () => getHome(),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}

export function usePhoneInbox(phone: string) {
  // Short QA identities (1234) are valid inbox keys; the server resolves them.
  const enabled = isPhoneIdentity(phone);
  return useQuery({
    queryKey: [...PHONE_INBOX_KEY, phone],
    queryFn: () => phoneInbox({ data: phone }),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}

/** Sent / caught totals for the phone identity, from Neon — survives a localStorage wipe. */
export function usePhoneStats(phone: string) {
  const enabled = isPhoneIdentity(phone);
  return useQuery({
    queryKey: [...PHONE_STATS_KEY, phone],
    queryFn: () => phoneStats({ data: phone }),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}

export function invalidateHome() {
  return queryClient.invalidateQueries({ queryKey: HOME_KEY });
}

/** Phone inbox and phone totals change together (a send or a catch moves both). */
export function invalidatePhoneInbox() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: PHONE_INBOX_KEY }),
    queryClient.invalidateQueries({ queryKey: PHONE_STATS_KEY }),
  ]);
}
