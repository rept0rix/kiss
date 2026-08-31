import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CatchScreen } from "@/components/catch-screen";
import { isValidPhone, phoneDigits } from "@/lib/contacts";
import { lookupFace, resolveShareLink } from "@/lib/kisses/server";
import { loadMe, saveMe } from "@/lib/me";

type Search = { p?: string };

export const Route = createFileRoute("/k/$from")({
  component: CatchRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    p: typeof s.p === "string" ? s.p : undefined,
  }),
  loader: async ({ params }) => {
    const raw = params.from || "";
    if (/^[a-z0-9]{4,8}$/i.test(raw) && !raw.includes(" ")) {
      const hit = await resolveShareLink({ data: raw.toLowerCase() });
      if (hit) return { ...hit, origin: "" };
    }
    return {
      fromName: decodeURIComponent(raw || "Someone"),
      toPhone: null as string | null,
      code: null as string | null,
      fromPhoto: (await lookupFace({ data: { name: decodeURIComponent(raw || "") } })).photo,
      origin: "",
    };
  },
  head: ({ loaderData }) => {
    const image = loaderData?.code ? `/c/${loaderData.code}` : "/og.jpg";
    return {
      meta: [
        { title: "Come get a kiss from me" },
        { name: "description", content: "I left one waiting for you." },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "Come get a kiss from me" },
        { property: "og:description", content: "Open it." },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:type", content: "image/jpeg" },
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
      photo={data.fromPhoto}
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
