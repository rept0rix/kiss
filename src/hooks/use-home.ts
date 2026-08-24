import { useQuery } from "@tanstack/react-query";
import { getHome } from "@/lib/kisses/server";
import { queryClient } from "@/lib/query-client";

export const HOME_KEY = ["home"] as const;

export function useHome(enabled = true) {
  return useQuery({
    queryKey: HOME_KEY,
    queryFn: () => getHome(),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}

export function invalidateHome() {
  return queryClient.invalidateQueries({ queryKey: HOME_KEY });
}
