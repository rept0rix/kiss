import { createFileRoute } from "@tanstack/react-router";
import { getShareCard } from "@/lib/kisses/server";

function jpegFromCard(card: string | null): Response {
  if (!card) {
    return new Response(null, { status: 302, headers: { Location: "/og.jpg" } });
  }
  const match = card.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match?.[2]) {
    return new Response(null, { status: 302, headers: { Location: "/og.jpg" } });
  }
  const bytes = Buffer.from(match[2], "base64");
  const type = match[1] === "png" ? "image/png" : "image/jpeg";
  return new Response(bytes, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400",
    },
  });
}

export const Route = createFileRoute("/c/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => jpegFromCard(await getShareCard({ data: params.code })),
    },
  },
});
