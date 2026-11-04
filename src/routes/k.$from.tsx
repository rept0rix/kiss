import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CatchScreen } from "@/components/catch-screen";
import { isValidPhone, phoneDigits } from "@/lib/contacts";
import { claimSocialHandle, lookupFace, resolveShareLink } from "@/lib/kisses/server";
import { loadMe, saveMe } from "@/lib/me";

type Search = {
  p?: string;
  social?: string;
  handle?: string;
};

export const Route = createFileRoute("/k/$from")({
  component: CatchRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    p: typeof s.p === "string" ? s.p : undefined,
    social: typeof s.social === "string" ? s.social : undefined,
    handle: typeof s.handle === "string" ? s.handle : undefined,
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
    const origin = "https://app.sendkiss.online";
    const imageCode = loaderData?.code || encodeURIComponent(loaderData?.fromName || "kiss");
    const image = `${origin}/c/${imageCode}`;
    const who = loaderData?.fromName || "me";
    return {
      meta: [
        { title: `Come get a kiss from ${who}` },
        { name: "description", content: "I left one waiting for you." },
        { property: "og:type", content: "website" },
        { property: "og:title", content: `Come get a kiss from ${who}` },
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
  const { p, social, handle } = Route.useSearch();
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const name = data.fromName || "Someone";
  const prev = loadMe();
  const linkedPhone = data.toPhone;

  const kicker = handle
    ? `${(social || "SOCIAL").toUpperCase()} KISS FOR @${handle.toUpperCase()}`
    : undefined;

  return (
    <CatchScreen
      from={name}
      photo={data.fromPhoto}
      first={prev.received === 0}
      kicker={kicker}
      onCaught={() => {
        const now = loadMe();
        const fromQuery = p && isValidPhone(p) ? phoneDigits(p) : "";
        const fromLink = linkedPhone && isValidPhone(linkedPhone) ? phoneDigits(linkedPhone) : "";
        const phone = fromQuery || fromLink || now.phone;

        if (social && handle && phone) {
          void claimSocialHandle({
            data: {
              phone,
              name: now.name || name,
              platform: social,
              handle,
            },
          }).catch(() => undefined);
        }

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
