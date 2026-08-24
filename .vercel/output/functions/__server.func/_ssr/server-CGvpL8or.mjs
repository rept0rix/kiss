import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { r as getSql } from "./db-htz3RCtV.mjs";
import { n as isSkin, t as authMiddleware } from "./ranks-CuwA0vI9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-CGvpL8or.js
var KISS_KINDS = [
	{
		id: "warm",
		label: "Smooch",
		hint: "The default hit"
	},
	{
		id: "miss",
		label: "Miss u",
		hint: "A little unhinged"
	},
	{
		id: "play",
		label: "Later",
		hint: "Chaotic friendly"
	}
];
function isKissKind(value) {
	return KISS_KINDS.some((k) => k.id === value) || isSkin(value) || value === "random";
}
var HANDLE_RE = /^[a-z0-9_]{3,20}$/;
function normalizeHandle(raw) {
	return raw.trim().toLowerCase();
}
function pairKey(a, b) {
	return a < b ? [a, b] : [b, a];
}
function utcToday() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function utcYesterday() {
	const d = /* @__PURE__ */ new Date();
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}
function mapProfile(row) {
	return {
		userId: row.user_id,
		handle: row.handle,
		displayName: row.display_name,
		bio: row.bio,
		avatarHue: Number(row.avatar_hue),
		openToRandom: Boolean(row.open_to_random),
		phone: row.phone
	};
}
async function isBlocked(me, them) {
	return (await (await getSql())`
    select 1 as n from blocks
    where (blocker_id = ${me} and blocked_id = ${them})
       or (blocker_id = ${them} and blocked_id = ${me})
    limit 1
  `).length > 0;
}
async function bumpStreak(me, them) {
	const sql = await getSql();
	const [low, high] = pairKey(me, them);
	const today = utcToday();
	const yday = utcYesterday();
	const existing = await sql`
    select count, last_date::text as last_date
    from streaks
    where user_low = ${low} and user_high = ${high}
  `;
	if (existing.length === 0) {
		await sql`
      insert into streaks (user_low, user_high, count, last_date)
      values (${low}, ${high}, 1, ${today}::date)
    `;
		return 1;
	}
	const last = existing[0].last_date.slice(0, 10);
	if (last === today) return Number(existing[0].count);
	const next = last === yday ? Number(existing[0].count) + 1 : 1;
	await sql`
    update streaks set count = ${next}, last_date = ${today}::date
    where user_low = ${low} and user_high = ${high}
  `;
	return next;
}
var getHome_createServerFn_handler = createServerRpc({
	id: "c28266f17f8477d6fb68a78c179a7b606959ce3d0ab9e2665015e002bc25179b",
	name: "getHome",
	filename: "src/lib/kisses/server.ts"
}, (opts) => getHome.__executeServer(opts));
var getHome = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getHome_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const me = context.userId;
	const profileRows = await sql`
      select user_id, handle, display_name, bio, avatar_hue, open_to_random, phone
      from profiles where user_id = ${me}
    `;
	let profile = profileRows[0] ? mapProfile(profileRows[0]) : null;
	if (!profile) {
		await sql`
        insert into profiles (user_id, handle, display_name, bio, avatar_hue, open_to_random)
        values (${me}, ${uniqueHandle(me)}, ${"You"}, ${""}, ${Math.abs(hashCode(me)) % 50 + 5}, ${true})
        on conflict (user_id) do nothing
      `;
		const created = await sql`
        select user_id, handle, display_name, bio, avatar_hue, open_to_random, phone
        from profiles where user_id = ${me}
      `;
		profile = created[0] ? mapProfile(created[0]) : null;
	}
	if (!profile) return {
		profile: null,
		friends: [],
		incoming: [],
		inbox: [],
		sent: [],
		sentToday: 0,
		receivedToday: 0,
		sentAll: 0,
		receivedAll: 0,
		randomRemaining: 1,
		leaderboard: [],
		people: []
	};
	await sql`update profiles set last_seen = now() where user_id = ${me}`;
	const friendRows = await sql`
      select p.user_id, p.handle, p.display_name, p.avatar_hue,
             coalesce(s.count, 0)::int as streak
      from friendships f
      join profiles p
        on p.user_id = case
          when f.requester_id = ${me} then f.addressee_id
          else f.requester_id
        end
      left join streaks s
        on s.user_low = least(${me}, p.user_id)
       and s.user_high = greatest(${me}, p.user_id)
      where f.status = 'accepted'
        and (f.requester_id = ${me} or f.addressee_id = ${me})
        and not exists (
          select 1 from blocks b
          where (b.blocker_id = ${me} and b.blocked_id = p.user_id)
             or (b.blocker_id = p.user_id and b.blocked_id = ${me})
        )
      order by p.display_name
    `;
	const incomingRows = await sql`
      select f.id, p.user_id, p.handle, p.display_name, p.avatar_hue
      from friendships f
      join profiles p on p.user_id = f.requester_id
      where f.addressee_id = ${me} and f.status = 'pending'
      order by f.created_at desc
    `;
	const inboxRows = await sql`
      select k.id, k.from_user_id, k.to_user_id, k.kind, k.note,
             k.created_at::text as created_at,
             k.caught_at::text as caught_at,
             p.handle as from_handle, p.display_name as from_name, p.avatar_hue as from_hue
      from kisses k
      join profiles p on p.user_id = k.from_user_id
      where k.to_user_id = ${me}
        and not exists (
          select 1 from blocks b
          where b.blocker_id = ${me} and b.blocked_id = k.from_user_id
        )
      order by k.created_at desc
      limit 40
    `;
	const sentRows = await sql`
      select k.id, k.to_user_id, p.display_name as to_name, p.handle as to_handle,
             k.caught_at::text as caught_at, k.created_at::text as created_at
      from kisses k
      join profiles p on p.user_id = k.to_user_id
      where k.from_user_id = ${me}
      order by k.created_at desc
      limit 20
    `;
	const counts = await sql`
      select
        (select count(*)::int from kisses where from_user_id = ${me} and created_at::date = current_date) as sent,
        (select count(*)::int from kisses where to_user_id = ${me} and created_at::date = current_date) as received,
        (select count(*)::int from kisses where from_user_id = ${me} and kind = 'random' and created_at::date = current_date) as randoms,
        (select count(*)::int from kisses where from_user_id = ${me}) as sent_all,
        (select count(*)::int from kisses where to_user_id = ${me}) as received_all
    `;
	const leaderRows = await sql`
      select p.user_id, p.handle, p.display_name, p.avatar_hue, count(*)::int as received
      from kisses k
      join profiles p on p.user_id = k.to_user_id
      where k.created_at >= (current_date - interval '7 days')
        and (
          k.to_user_id = ${me}
          or exists (
            select 1 from friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = ${me} and f.addressee_id = k.to_user_id)
                or (f.addressee_id = ${me} and f.requester_id = k.to_user_id)
              )
          )
        )
      group by p.user_id, p.handle, p.display_name, p.avatar_hue
      order by received desc
      limit 8
    `;
	const friends = friendRows.map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue),
		streak: Number(r.streak),
		pendingIncoming: false
	}));
	const incoming = incomingRows.map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue),
		streak: 0,
		pendingIncoming: true,
		friendshipId: Number(r.id)
	}));
	const inbox = inboxRows.map((r) => ({
		id: Number(r.id),
		fromUserId: r.from_user_id,
		toUserId: r.to_user_id,
		kind: r.kind,
		note: r.note,
		createdAt: r.created_at,
		caughtAt: r.caught_at,
		fromHandle: r.from_handle,
		fromName: r.from_name,
		fromHue: Number(r.from_hue)
	}));
	const sent = sentRows.map((r) => ({
		id: Number(r.id),
		toUserId: r.to_user_id,
		toName: r.to_name,
		toHandle: r.to_handle,
		caught: Boolean(r.caught_at),
		createdAt: r.created_at
	}));
	const leaderboard = leaderRows.map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue),
		received: Number(r.received)
	}));
	const people = (await sql`
      select user_id, handle, display_name, avatar_hue, last_seen::text as last_seen
      from profiles
      where user_id <> ${me}
        and coalesce(display_name, '') <> ''
        and not exists (
          select 1 from blocks b
          where (b.blocker_id = ${me} and b.blocked_id = profiles.user_id)
             or (b.blocker_id = profiles.user_id and b.blocked_id = ${me})
        )
      order by last_seen desc nulls last, display_name
      limit 40
    `).map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue),
		lastSeen: r.last_seen
	}));
	const randomUsed = Number(counts[0]?.randoms ?? 0);
	return {
		profile,
		friends,
		incoming,
		inbox,
		sent,
		sentToday: Number(counts[0]?.sent ?? 0),
		receivedToday: Number(counts[0]?.received ?? 0),
		sentAll: Number(counts[0]?.sent_all ?? 0),
		receivedAll: Number(counts[0]?.received_all ?? 0),
		randomRemaining: randomUsed >= 1 ? 0 : 1,
		leaderboard,
		people
	};
});
var upsertProfile_createServerFn_handler = createServerRpc({
	id: "a7cfb66bfe22dc63b14f4fd08b1f0f36f6ae6a5470b9cc261fe57724b010a103",
	name: "upsertProfile",
	filename: "src/lib/kisses/server.ts"
}, (opts) => upsertProfile.__executeServer(opts));
var upsertProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(upsertProfile_createServerFn_handler, async ({ context, data }) => {
	const handle = normalizeHandle(data.handle);
	const displayName = data.displayName.trim().slice(0, 32);
	const bio = (data.bio ?? "").trim().slice(0, 120);
	if (!HANDLE_RE.test(handle)) throw new Error("Handle must be 3–20 letters, numbers, or _");
	if (displayName.length < 2) throw new Error("Give yourself a name");
	const sql = await getSql();
	if ((await sql`
      select user_id from profiles where handle = ${handle} and user_id <> ${context.userId}
    `).length > 0) throw new Error("That handle is taken");
	const hue = (await sql`
      select avatar_hue from profiles where user_id = ${context.userId}
    `)[0]?.avatar_hue ?? Math.abs(hashCode(context.userId)) % 50 + 5;
	await sql`
      insert into profiles (user_id, handle, display_name, bio, avatar_hue, open_to_random)
      values (${context.userId}, ${handle}, ${displayName}, ${bio}, ${hue}, ${Boolean(data.openToRandom)})
      on conflict (user_id) do update set
        handle = excluded.handle,
        display_name = excluded.display_name,
        bio = excluded.bio,
        open_to_random = excluded.open_to_random
    `;
	return { ok: true };
});
function hashCode(s) {
	let h = 0;
	for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
	return h;
}
function uniqueHandle(userId) {
	return `k${(userId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-10) || "kiss").padEnd(6, "x")}`.slice(0, 20);
}
var searchPeople_createServerFn_handler = createServerRpc({
	id: "f266e40787c19954abaef16bb4f1f66a93659ff8bfd4ed146372c984e16733a6",
	name: "searchPeople",
	filename: "src/lib/kisses/server.ts"
}, (opts) => searchPeople.__executeServer(opts));
var searchPeople = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((q) => q).handler(searchPeople_createServerFn_handler, async ({ context, data: raw }) => {
	const q = raw.trim().toLowerCase().replace(/[%_]/g, "").slice(0, 32);
	const digits = raw.replace(/\D/g, "").slice(0, 15);
	const sql = await getSql();
	const me = context.userId;
	const like = q.length > 0 ? `%${q}%` : null;
	const phoneLike = digits.length >= 6 ? `%${digits}%` : "%__no_phone__%";
	return (like ? await sql`
          select user_id, handle, display_name, avatar_hue, last_seen::text as last_seen
          from profiles
          where user_id <> ${me}
            and coalesce(display_name, '') <> ''
            and (
              lower(handle) like ${like}
              or lower(display_name) like ${like}
              or phone like ${phoneLike}
            )
            and not exists (
              select 1 from blocks b
              where (b.blocker_id = ${me} and b.blocked_id = profiles.user_id)
                 or (b.blocker_id = profiles.user_id and b.blocked_id = ${me})
            )
          order by last_seen desc nulls last, display_name
          limit 40
        ` : await sql`
          select user_id, handle, display_name, avatar_hue, last_seen::text as last_seen
          from profiles
          where user_id <> ${me}
            and coalesce(display_name, '') <> ''
            and not exists (
              select 1 from blocks b
              where (b.blocker_id = ${me} and b.blocked_id = profiles.user_id)
                 or (b.blocker_id = profiles.user_id and b.blocked_id = ${me})
            )
          order by last_seen desc nulls last, display_name
          limit 40
        `).map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue),
		lastSeen: r.last_seen
	}));
});
var browsePeople_createServerFn_handler = createServerRpc({
	id: "f9896789eb12b16dc8fd72db0206a8ab69e71ba72c28c053a3c3f71e4ea3948e",
	name: "browsePeople",
	filename: "src/lib/kisses/server.ts"
}, (opts) => browsePeople.__executeServer(opts));
var browsePeople = createServerFn({ method: "GET" }).handler(browsePeople_createServerFn_handler, async () => {
	return (await (await getSql())`
      select user_id, handle, display_name, avatar_hue, last_seen::text as last_seen
      from profiles
      where coalesce(display_name, '') <> ''
        and lower(display_name) <> 'you'
      order by last_seen desc nulls last, display_name
      limit 50
    `).map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue),
		lastSeen: r.last_seen
	}));
});
var matchPhones_createServerFn_handler = createServerRpc({
	id: "5cf015d7a6e57cff719e072a2097d2134b4daa1027aead5828bd0c3b1b24446e",
	name: "matchPhones",
	filename: "src/lib/kisses/server.ts"
}, (opts) => matchPhones.__executeServer(opts));
var matchPhones = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((phones) => phones).handler(matchPhones_createServerFn_handler, async ({ context, data: phones }) => {
	const variants = /* @__PURE__ */ new Set();
	for (const raw of phones.slice(0, 80)) {
		const phone = normalizePhone(raw);
		if (phone.length < 8 || phone.length > 15) continue;
		variants.add(phone);
		variants.add(phone.startsWith("0") ? phone.slice(1) : `0${phone}`);
	}
	if (variants.size === 0) return [];
	const list = [...variants];
	return (await (await getSql()).query(`select user_id, handle, display_name, avatar_hue
       from profiles
       where user_id <> $1
         and phone is not null
         and phone = any($2::text[])
         and not exists (
           select 1 from blocks b
           where (b.blocker_id = $1 and b.blocked_id = profiles.user_id)
              or (b.blocker_id = profiles.user_id and b.blocked_id = $1)
         )
       limit 40`, [context.userId, list])).map((r) => ({
		userId: r.user_id,
		handle: r.handle,
		displayName: r.display_name,
		avatarHue: Number(r.avatar_hue)
	}));
});
var requestFriend_createServerFn_handler = createServerRpc({
	id: "f8ff61ecf89a668eea414148e2c147939689e1a63fb5feb1d0a12a75163684b4",
	name: "requestFriend",
	filename: "src/lib/kisses/server.ts"
}, (opts) => requestFriend.__executeServer(opts));
var requestFriend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((handle) => handle).handler(requestFriend_createServerFn_handler, async ({ context, data: raw }) => {
	const handle = normalizeHandle(raw);
	const sql = await getSql();
	const me = context.userId;
	const target = await sql`
      select user_id from profiles where handle = ${handle}
    `;
	if (!target[0]) throw new Error("Nobody with that handle");
	const them = target[0].user_id;
	if (them === me) throw new Error("That's you");
	if (await isBlocked(me, them)) throw new Error("Can't send that");
	const existing = await sql`
      select status, requester_id from friendships
      where (requester_id = ${me} and addressee_id = ${them})
         or (requester_id = ${them} and addressee_id = ${me})
    `;
	if (existing[0]?.status === "accepted") return { ok: true };
	if (existing[0]?.status === "pending" && existing[0].requester_id === them) {
		await sql`
        update friendships set status = 'accepted'
        where requester_id = ${them} and addressee_id = ${me}
      `;
		return { ok: true };
	}
	if (existing[0]) return { ok: true };
	await sql`
      insert into friendships (requester_id, addressee_id, status)
      values (${me}, ${them}, 'pending')
    `;
	return { ok: true };
});
var acceptFriend_createServerFn_handler = createServerRpc({
	id: "353b8fc3ff348f1228ef211bc840f602b5aa336ab03fdeb4045c3465e2d3f1f7",
	name: "acceptFriend",
	filename: "src/lib/kisses/server.ts"
}, (opts) => acceptFriend.__executeServer(opts));
var acceptFriend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(acceptFriend_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`
      update friendships set status = 'accepted'
      where id = ${id} and addressee_id = ${context.userId} and status = 'pending'
    `;
	return { ok: true };
});
var declineFriend_createServerFn_handler = createServerRpc({
	id: "01af8e25b1e70190450b8d0ea818c43b549f610d60c587d9cc9cdcc2d6b0daf7",
	name: "declineFriend",
	filename: "src/lib/kisses/server.ts"
}, (opts) => declineFriend.__executeServer(opts));
var declineFriend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(declineFriend_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`
      delete from friendships
      where id = ${id} and addressee_id = ${context.userId} and status = 'pending'
    `;
	return { ok: true };
});
var sendKiss_createServerFn_handler = createServerRpc({
	id: "5de9c1aaeef2fd5a84d2402981967765b0946ad65ad9173bde349da26a6d8c99",
	name: "sendKiss",
	filename: "src/lib/kisses/server.ts"
}, (opts) => sendKiss.__executeServer(opts));
var sendKiss = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(sendKiss_createServerFn_handler, async ({ context, data }) => {
	const me = context.userId;
	const them = data.toUserId;
	if (them === me) throw new Error("Kiss someone else");
	if (!isKissKind(data.kind)) throw new Error("Unknown kiss");
	if (await isBlocked(me, them)) throw new Error("Can't send that");
	const n = Math.min(69, Math.max(1, Math.floor(data.count ?? 1)));
	const sql = await getSql();
	if (!(await sql`select user_id from profiles where user_id = ${them}`)[0]) throw new Error("They are not on KISS yet");
	const note = (data.note ?? "").trim().slice(0, 80);
	const inserted = await sql`
      insert into kisses (from_user_id, to_user_id, kind, note)
      select ${me}, ${them}, ${data.kind}, ${note}
      from generate_series(1, ${n})
      returning id
    `;
	const streak = await bumpStreak(me, them);
	return {
		id: Number(inserted[0]?.id),
		streak,
		kind: data.kind,
		count: n
	};
});
var catchKiss_createServerFn_handler = createServerRpc({
	id: "f847bc4f2e0841843c7d47dba394c9fc872ddf99ceda720bc2f5e04e0dfd7584",
	name: "catchKiss",
	filename: "src/lib/kisses/server.ts"
}, (opts) => catchKiss.__executeServer(opts));
var catchKiss = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(catchKiss_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`
      update kisses
      set caught_at = now()
      where id = ${id}
        and to_user_id = ${context.userId}
        and caught_at is null
    `;
	return { ok: true };
});
var setDisplayName_createServerFn_handler = createServerRpc({
	id: "222b817d6834b3fddfbabaabc917c7295e5c197d750cdbb35b8c456d96002f26",
	name: "setDisplayName",
	filename: "src/lib/kisses/server.ts"
}, (opts) => setDisplayName.__executeServer(opts));
var setDisplayName = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((name) => name).handler(setDisplayName_createServerFn_handler, async ({ context, data: raw }) => {
	const displayName = raw.trim().slice(0, 32);
	if (displayName.length < 2) throw new Error("Give yourself a name");
	await (await getSql())`
      update profiles set display_name = ${displayName}
      where user_id = ${context.userId}
    `;
	return { ok: true };
});
function normalizePhone(raw) {
	const trimmed = raw.trim();
	const d = trimmed.replace(/\D/g, "");
	if (trimmed.startsWith("+")) return d;
	if (d.startsWith("00")) return d.slice(2);
	return d;
}
var setPhone_createServerFn_handler = createServerRpc({
	id: "e57dafb45ccef2030048ceafbc8f394050ab875e54550b1a95b1502315eb0696",
	name: "setPhone",
	filename: "src/lib/kisses/server.ts"
}, (opts) => setPhone.__executeServer(opts));
var setPhone = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((phone) => phone).handler(setPhone_createServerFn_handler, async ({ context, data: raw }) => {
	const phone = normalizePhone(raw);
	if (phone.length < 8 || phone.length > 15) throw new Error("Need a real phone number");
	const sql = await getSql();
	if ((await sql`
      select user_id from profiles
      where phone = ${phone} and user_id <> ${context.userId}
    `).length > 0) throw new Error("That number is already on KISS");
	await sql`
      update profiles set phone = ${phone}
      where user_id = ${context.userId}
    `;
	return {
		ok: true,
		phone
	};
});
var findByPhone_createServerFn_handler = createServerRpc({
	id: "c80f170e2393cc9b2ed559550945ff51d8273ac775a465b92d206151f44c40a1",
	name: "findByPhone",
	filename: "src/lib/kisses/server.ts"
}, (opts) => findByPhone.__executeServer(opts));
var findByPhone = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((phone) => phone).handler(findByPhone_createServerFn_handler, async ({ context, data: raw }) => {
	const phone = normalizePhone(raw);
	if (phone.length < 8) return null;
	const alt = phone.startsWith("0") ? phone.slice(1) : `0${phone}`;
	const rows = await (await getSql())`
      select user_id, handle, display_name, avatar_hue
      from profiles
      where user_id <> ${context.userId}
        and phone is not null
        and (phone = ${phone} or phone = ${alt})
        and not exists (
          select 1 from blocks b
          where (b.blocker_id = ${context.userId} and b.blocked_id = profiles.user_id)
             or (b.blocker_id = profiles.user_id and b.blocked_id = ${context.userId})
        )
      limit 1
    `;
	if (!rows[0]) return null;
	return {
		userId: rows[0].user_id,
		handle: rows[0].handle,
		displayName: rows[0].display_name,
		avatarHue: Number(rows[0].avatar_hue)
	};
});
var sendRandomKiss_createServerFn_handler = createServerRpc({
	id: "daaefd1b96122bd9195cec25e6caba33ad7a04974331977c94e3c774993bfb65",
	name: "sendRandomKiss",
	filename: "src/lib/kisses/server.ts"
}, (opts) => sendRandomKiss.__executeServer(opts));
var sendRandomKiss = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((kind) => kind).handler(sendRandomKiss_createServerFn_handler, async ({ context, data: kind }) => {
	const me = context.userId;
	if (!isKissKind(kind)) throw new Error("Unknown kiss");
	const sql = await getSql();
	if (!(await sql`
      select open_to_random from profiles where user_id = ${me}
    `)[0]?.open_to_random) throw new Error("Turn on stranger kisses in your profile");
	const used = await sql`
      select count(*)::int as n from kisses
      where from_user_id = ${me} and kind = 'random' and created_at::date = current_date
    `;
	if (Number(used[0]?.n ?? 0) >= 1) throw new Error("You already threw today's stranger kiss");
	const candidates = await sql`
      select user_id, handle, display_name from profiles
      where open_to_random = true
        and user_id <> ${me}
        and not exists (
          select 1 from blocks b
          where (b.blocker_id = ${me} and b.blocked_id = profiles.user_id)
             or (b.blocker_id = profiles.user_id and b.blocked_id = ${me})
        )
      order by random()
      limit 1
    `;
	if (!candidates[0]) throw new Error("Nobody is catching stranger kisses yet");
	await sql`
      insert into kisses (from_user_id, to_user_id, kind, note)
      values (${me}, ${candidates[0].user_id}, 'random', ${kind})
    `;
	return {
		handle: candidates[0].handle,
		displayName: candidates[0].display_name,
		kind
	};
});
var blockPerson_createServerFn_handler = createServerRpc({
	id: "8dbdceda2238388f8f6f6d1786c77c9d22dc9227b9569a573d88352d9b18fbf6",
	name: "blockPerson",
	filename: "src/lib/kisses/server.ts"
}, (opts) => blockPerson.__executeServer(opts));
var blockPerson = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((userId) => userId).handler(blockPerson_createServerFn_handler, async ({ context, data: them }) => {
	if (them === context.userId) return { ok: true };
	const sql = await getSql();
	await sql`
      insert into blocks (blocker_id, blocked_id)
      values (${context.userId}, ${them})
      on conflict do nothing
    `;
	await sql`
      delete from friendships
      where (requester_id = ${context.userId} and addressee_id = ${them})
         or (requester_id = ${them} and addressee_id = ${context.userId})
    `;
	return { ok: true };
});
//#endregion
export { acceptFriend_createServerFn_handler, blockPerson_createServerFn_handler, browsePeople_createServerFn_handler, catchKiss_createServerFn_handler, declineFriend_createServerFn_handler, findByPhone_createServerFn_handler, getHome_createServerFn_handler, matchPhones_createServerFn_handler, requestFriend_createServerFn_handler, searchPeople_createServerFn_handler, sendKiss_createServerFn_handler, sendRandomKiss_createServerFn_handler, setDisplayName_createServerFn_handler, setPhone_createServerFn_handler, upsertProfile_createServerFn_handler };
