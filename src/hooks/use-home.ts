import { useQuery } from "@tanstack/react-query";
import { getHome, phoneInbox } from "@/lib/kisses/server";
import { queryClient } from "@/lib/query-client";

export const HOME_KEY = ["home"] as const;
export const PHONE_INBOX_KEY = ["phone-inbox"] as const;

export function useHome(enabled = true) {
  return useQuery({
    queryKey: HOME_KEY,
    queryFn: () => getHome(),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}

export function usePhoneInbox(phone: string) {
  const enabled = phone.replace(/\D/g, "").length >= 8;
  return useQuery({
    queryKey: [...PHONE_INBOX_KEY, phone],
    queryFn: () => phoneInbox({ data: phone }),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}

export function invalidateHome() {
  return queryClient.invalidateQueries({ queryKey: HOME_KEY });
}

export function invalidatePhoneInbox() {
  return queryClient.invalidateQueries({ queryKey: PHONE_INBOX_KEY });
}
