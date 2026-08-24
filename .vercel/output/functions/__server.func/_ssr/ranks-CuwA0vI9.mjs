import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ranks-CuwA0vI9.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-Cm1077F-.mjs");
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-BVwVfePZ.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var RANKS = [
	{
		min: 0,
		id: "rookie",
		name: "Rookie",
		skin: "classic"
	},
	{
		min: 250,
		id: "crush",
		name: "Crush",
		skin: "gold"
	},
	{
		min: 400,
		id: "heat",
		name: "Heat",
		skin: "pink"
	},
	{
		min: 650,
		id: "flame",
		name: "Flame",
		skin: "fire"
	},
	{
		min: 900,
		id: "frost",
		name: "Frost",
		skin: "ice"
	},
	{
		min: 1500,
		id: "venom",
		name: "Venom",
		skin: "venom"
	},
	{
		min: 2500,
		id: "royal",
		name: "Royal",
		skin: "royal"
	},
	{
		min: 5e3,
		id: "void",
		name: "Void",
		skin: "void"
	},
	{
		min: 1e4,
		id: "myth",
		name: "Myth",
		skin: "myth"
	},
	{
		min: 25e3,
		id: "god",
		name: "God",
		skin: "god"
	},
	{
		min: 5e4,
		id: "eternal",
		name: "Eternal",
		skin: "eternal"
	},
	{
		min: 1e5,
		id: "immortal",
		name: "Immortal",
		skin: "immortal"
	}
];
function rankAt(kisses) {
	let current = RANKS[0];
	for (const r of RANKS) if (kisses >= r.min) current = r;
	return current;
}
function nextRank(kisses) {
	const cur = rankAt(kisses);
	return RANKS[RANKS.findIndex((r) => r.id === cur.id) + 1] ?? null;
}
function isSkin(value) {
	return RANKS.some((r) => r.skin === value);
}
//#endregion
export { rankAt as i, isSkin as n, nextRank as r, authMiddleware as t };
