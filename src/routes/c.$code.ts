import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/c/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { shareCardResponse } = await import("@/lib/kisses/share-card-image");
        return shareCardResponse(params.code);
      },
    },
  },
});
