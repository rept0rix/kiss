import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
