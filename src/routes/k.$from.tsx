import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CatchScreen } from "@/components/catch-screen";
import { isValidPhone, phoneDigits } from "@/lib/contacts";
import { loadMe, saveMe } from "@/lib/me";

type Search = { p?: string };

export const Route = createFileRoute("/k/$from")({
  component: CatchRoute,
  validateSearch: (s: Record<string, unknown>): Search => ({
    p: typeof s.p === "string" ? s.p : undefined,
  }),
  head: ({ params }) => {
    const who = decodeURIComponent(params.from || "Someone");
    return {
      meta: [
        { title: `${who} kissed you` },
        { name: "description", content: "Open it. Catch the kiss." },
        { property: "og:title", content: `${who} kissed you` },
        { property: "og:description", content: "A kiss just landed. Open it." },
      ],
    };
  },
});

function CatchRoute() {
  const { from } = Route.useParams();
  const { p } = Route.useSearch();
  const navigate = useNavigate();
  const name = decodeURIComponent(from || "Someone");
  const prev = loadMe();

  return (
    <CatchScreen
      from={name}
      first={prev.received === 0}
      onCaught={() => {
        const now = loadMe();
        const phone = p && isValidPhone(p) ? phoneDigits(p) : now.phone;
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