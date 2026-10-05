import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/og/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { shareCardResponse } = await import("@/lib/kisses/share-card-image");
        return shareCardResponse(params.code);
      },
    },
  },
});
