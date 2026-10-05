import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CatchScreen } from "@/components/catch-screen";
import { useHydrated } from "@/hooks/use-hydrated";
import { isValidPhone, phoneDigits } from "@/lib/contacts";
import { getShareOrigin, lookupFace, resolveShareLink } from "@/lib/kisses/server";
import { inviteTitle } from "@/lib/invite-title";
import { loadMe, saveMe } from "@/lib/me";

type Search = { p?: string };

export const Route = createFileRoute("/k/$from")({
  component: CatchRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    p: typeof s.p === "string" ? s.p : undefined,
  }),
  loader: async ({ params }) => {
    const raw = params.from || "";
    const origin = await getShareOrigin().catch(() => "");
    const codeShaped = /^[a-z0-9]{4,8}$/i.test(raw);
    if (codeShaped) {
      const hit = await resolveShareLink({ data: raw.toLowerCase() });
      if (hit) return { ...hit, origin, title: inviteTitle(hit.fromName) };
    }
    const fromName = decodeURIComponent(raw || "Someone");
    return {
      fromName,
      // An unknown code is not a name; keep the generic preview for dead links.
      title: inviteTitle(codeShaped ? null : fromName),
      toPhone: null as string | null,
      code: null as string | null,
      fromPhoto: (await lookupFace({ data: { name: decodeURIComponent(raw || "") } })).photo,
      origin,
    };
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? "";
    const image = `${origin}${loaderData?.code ? `/c/${loaderData.code}` : "/og.jpg"}`;
    const url = `${origin}/k/${encodeURIComponent(params.from ?? "")}`;
    const title = loaderData?.title ?? inviteTitle(null);
    return {
      meta: [
        { title },
        { name: "description", content: "I left one waiting for you." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:title", content: title },
        { property: "og:description", content: "Open it." },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
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
  // localStorage only exists on the client; read it after hydration so the
  // "FIRST KISS"/"INCOMING" kicker matches the server HTML.
  const hydrated = useHydrated();
  const firstKiss = hydrated ? loadMe().received === 0 : true;
  const linkedPhone = data.toPhone;

  return (
    <CatchScreen
      from={name}
      photo={data.fromPhoto}
      first={firstKiss}
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
