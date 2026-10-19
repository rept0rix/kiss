import { createFileRoute } from "@tanstack/react-router";
import { enabledProviders, resolveAuthEnv } from "@/lib/auth/auth-env";

export const Route = createFileRoute("/api/auth-providers")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          { providers: enabledProviders(resolveAuthEnv(process.env)) },
          { headers: { "cache-control": "no-store" } },
        ),
    },
  },
});
