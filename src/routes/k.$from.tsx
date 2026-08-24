import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CatchScreen } from "@/components/catch-screen";
import { isValidPhone, phoneDigits } from "@/lib/contacts";
import { resolveShareLink } from "@/lib/kisses/server";
import { loadMe, saveMe } from "@/lib/me";

type Search = { p?: string };

function ogImage(code?: string | null) {
  if (!code) return "/og.jpg";
  return `/api/og/${code}`;
}

export const Route = createFileRoute("/k/$from")({
  component: CatchRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    p: typeof s.p === "string" ? s.p : undefined,
  }),
  loader: async ({ params }) => {
    const raw = params.from || "";
    if (/^[a-z0-9]{4,8}$/i.test(raw) && !raw.includes(" ")) {
      const hit = await resolveShareLink({ data: raw.toLowerCase() });
      if (hit) return hit;
    }
    return {
      fromName: decodeURIComponent(raw || "Someone"),
      toPhone: null as string | null,
      code: null as string | null,
    };
  },
  head: ({ loaderData }) => {
    const image = ogImage(loaderData?.code);
    return {
      meta: [
        { title: "I kiss you now" },
        { name: "description", content: "Come inside and get it." },
        { property: "og:title", content: "I kiss you now" },
        { property: "og:description", content: "Come inside and get it." },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
    };
  },
});

function CatchRoute() {
  const { p } = Route.useSearch();
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const name = data.fromName || "Someone";
  const prev = loadMe();
  const linkedPhone = data.toPhone;

  return (
    <CatchScreen
      from={name}
      first={prev.received === 0}
      onCaught={() => {
        const now = loadMe();
        const fromQuery = p && isValidPhone(p) ? phoneDigits(p) : "";
        const fromLink = linkedPhone && isValidPhone(linkedPhone) ? phoneDigits(linkedPhone) : "";
        const phone = fromQuery || fromLink || now.phone;
        saveMe({
          ...now,
          received: now.received + 1,
          entered: true,
          phone: phone || now.phone,
        });
        void navigate({ to: "/", search: {}, replace: true });
      }}
    />
  );
}
