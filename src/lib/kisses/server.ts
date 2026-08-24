import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isKissKind, type KissKindId } from "./kinds";
import type { Friend, HomePayload, KissRow, LeaderRow, Profile, PublicPerson, SentKiss } from "./types";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

type ProfileRow = {
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_hue: number;
  open_to_random: boolean;
  phone: string | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarHue: Number(row.avatar_hue),
    openToRandom: Boolean(row.open_to_random),
    phone: row.phone,
  };
}

async function isBlocked(me: string, them: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select 1 as n from blocks
    where (blocker_id = ${me} and blocked_id = ${them})
       or (blocker_id = ${them} and blocked_id = ${me})
    limit 1
  `;
  return rows.length > 0;
}

async function areFriends(me: string, them: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select 1 as n from friendships
    where status = 'accepted'
      and (
        (requester_id = ${me} and addressee_id = ${them})
        or (requester_id = ${them} and addressee_id = ${me})
      )
    limit 1
  `;
  return rows.length > 0;
}

async function bumpStreak(me: string, them: string): Promise<number> {
  const sql = await getSql();
  const [low, high] = pairKey(me, them);
  const today = utcToday();
  const yday = utcYesterday();
  const existing = await sql<{ count: number; last_date: string }>`
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

export const getHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<HomePayload> => {
    const sql = await getSql();
    const me = context.userId;

    const profileRows = await sql<ProfileRow>`
      select user_id, handle, display_name, bio, avatar_hue, open_to_random, phone
      from profiles where user_id = ${me}
    `;
    let profile = profileRows[0] ? mapProfile(profileRows[0]) : null;
    if (!profile) {
      const handle = uniqueHandle(me);
      const hue = (Math.abs(hashCode(me)) % 50) + 5;
      await sql`
        insert into profiles (user_id, handle, display_name, bio, avatar_hue, open_to_random)
        values (${me}, ${handle}, ${"You"}, ${""}, ${hue}, ${true})
        on conflict (user_id) do nothing
      `;
      const created = await sql<ProfileRow>`
        select user_id, handle, display_name, bio, avatar_hue, open_to_random, phone
        from profiles where user_id = ${me}
      `;
      profile = created[0] ? mapProfile(created[0]) : null;
    }
    if (!profile) {
      return {
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
        people: [],
      };
    }

    await sql`update profiles set last_seen = now() where user_id = ${me}`;

    const friendRows = await sql<{
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
      streak: number;
    }>`
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

    const incomingRows = await sql<{
      id: number;
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
    }>`
      select f.id, p.user_id, p.handle, p.display_name, p.avatar_hue
      from friendships f
      join profiles p on p.user_id = f.requester_id
      where f.addressee_id = ${me} and f.status = 'pending'
      order by f.created_at desc
    `;

    const inboxRows = await sql<{
      id: number;
      from_user_id: string;
      to_user_id: string;
      kind: string;
      note: string;
      created_at: string;
      caught_at: string | null;
      from_handle: string;
      from_name: string;
      from_hue: number;
    }>`
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

    const sentRows = await sql<{
      id: number;
      to_user_id: string;
      to_name: string;
      to_handle: string;
      caught_at: string | null;
      created_at: string;
    }>`
      select k.id, k.to_user_id, p.display_name as to_name, p.handle as to_handle,
             k.caught_at::text as caught_at, k.created_at::text as created_at
      from kisses k
      join profiles p on p.user_id = k.to_user_id
      where k.from_user_id = ${me}
      order by k.created_at desc
      limit 20
    `;

    const counts = await sql<{ sent: number; received: number; randoms: number; sent_all: number; received_all: number }>`
      select
        (select count(*)::int from kisses where from_user_id = ${me} and created_at::date = current_date) as sent,
        (select count(*)::int from kisses where to_user_id = ${me} and created_at::date = current_date) as received,
        (select count(*)::int from kisses where from_user_id = ${me} and kind = 'random' and created_at::date = current_date) as randoms,
        (select count(*)::int from kisses where from_user_id = ${me}) as sent_all,
        (select count(*)::int from kisses where to_user_id = ${me}) as received_all
    `;

    const leaderRows = await sql<{
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
      received: number;
    }>`
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

    const friends: Friend[] = friendRows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
      streak: Number(r.streak),
      pendingIncoming: false,
    }));

    const incoming: Friend[] = incomingRows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
      streak: 0,
      pendingIncoming: true,
      friendshipId: Number(r.id),
    }));

    const inbox: KissRow[] = inboxRows.map((r) => ({
      id: Number(r.id),
      fromUserId: r.from_user_id,
      toUserId: r.to_user_id,
      kind: r.kind,
      note: r.note,
      createdAt: r.created_at,
      caughtAt: r.caught_at,
      fromHandle: r.from_handle,
      fromName: r.from_name,
      fromHue: Number(r.from_hue),
    }));

    const sent: SentKiss[] = sentRows.map((r) => ({
      id: Number(r.id),
      toUserId: r.to_user_id,
      toName: r.to_name,
      toHandle: r.to_handle,
      caught: Boolean(r.caught_at),
      createdAt: r.created_at,
    }));

    const leaderboard: LeaderRow[] = leaderRows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
      received: Number(r.received),
    }));

    const peopleRows = await sql<{
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
      last_seen: string | null;
    }>`
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
    `;

    const people: PublicPerson[] = peopleRows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
      lastSeen: r.last_seen,
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
      people,
    };
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { handle: string; displayName: string; bio?: string; openToRandom?: boolean }) => data)
  .handler(async ({ context, data }) => {
    const handle = normalizeHandle(data.handle);
    const displayName = data.displayName.trim().slice(0, 32);
    const bio = (data.bio ?? "").trim().slice(0, 120);
    if (!HANDLE_RE.test(handle)) {
      throw new Error("Handle must be 3–20 letters, numbers, or _");
    }
    if (displayName.length < 2) {
      throw new Error("Give yourself a name");
    }
    const sql = await getSql();
    const taken = await sql<{ user_id: string }>`
      select user_id from profiles where handle = ${handle} and user_id <> ${context.userId}
    `;
    if (taken.length > 0) throw new Error("That handle is taken");

    const existing = await sql<{ avatar_hue: number }>`
      select avatar_hue from profiles where user_id = ${context.userId}
    `;
    const hue =
      existing[0]?.avatar_hue ??
      (Math.abs(hashCode(context.userId)) % 50) + 5;

    await sql`
      insert into profiles (user_id, handle, display_name, bio, avatar_hue, open_to_random)
      values (${context.userId}, ${handle}, ${displayName}, ${bio}, ${hue}, ${Boolean(data.openToRandom)})
      on conflict (user_id) do update set
        handle = excluded.handle,
        display_name = excluded.display_name,
        bio = excluded.bio,
        open_to_random = excluded.open_to_random
    `;
    return { ok: true as const };
  });

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

function uniqueHandle(userId: string): string {
  const raw = userId.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tail = (raw.slice(-10) || "kiss").padEnd(6, "x");
  return `k${tail}`.slice(0, 20);
}

export const searchPeople = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((q: string) => q)
  .handler(async ({ context, data: raw }): Promise<PublicPerson[]> => {
    const q = raw.trim().toLowerCase().replace(/[%_]/g, "").slice(0, 32);
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    const sql = await getSql();
    const me = context.userId;
    const like = q.length > 0 ? `%${q}%` : null;
    const phoneLike = digits.length >= 6 ? `%${digits}%` : "%__no_phone__%";
    const rows = like
      ? await sql<{
          user_id: string;
          handle: string;
          display_name: string;
          avatar_hue: number;
          last_seen: string | null;
        }>`
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
        `
      : await sql<{
          user_id: string;
          handle: string;
          display_name: string;
          avatar_hue: number;
          last_seen: string | null;
        }>`
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
        `;
    return rows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
      lastSeen: r.last_seen,
    }));
  });

export const browsePeople = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPerson[]> => {
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
      last_seen: string | null;
    }>`
      select user_id, handle, display_name, avatar_hue, last_seen::text as last_seen
      from profiles
      where coalesce(display_name, '') <> ''
        and lower(display_name) <> 'you'
      order by last_seen desc nulls last, display_name
      limit 50
    `;
    return rows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
      lastSeen: r.last_seen,
    }));
  },
);

export const matchPhones = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((phones: string[]) => phones)
  .handler(async ({ context, data: phones }): Promise<PublicPerson[]> => {
    const variants = new Set<string>();
    for (const raw of phones.slice(0, 80)) {
      const phone = normalizePhone(raw);
      if (phone.length < 8 || phone.length > 15) continue;
      variants.add(phone);
      variants.add(phone.startsWith("0") ? phone.slice(1) : `0${phone}`);
    }
    if (variants.size === 0) return [];
    const list = [...variants];
    const sql = await getSql();
    const rows = await sql.query<{
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
    }>(
      `select user_id, handle, display_name, avatar_hue
       from profiles
       where user_id <> $1
         and phone is not null
         and phone = any($2::text[])
         and not exists (
           select 1 from blocks b
           where (b.blocker_id = $1 and b.blocked_id = profiles.user_id)
              or (b.blocker_id = profiles.user_id and b.blocked_id = $1)
         )
       limit 40`,
      [context.userId, list],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      avatarHue: Number(r.avatar_hue),
    }));
  });

export const requestFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((handle: string) => handle)
  .handler(async ({ context, data: raw }) => {
    const handle = normalizeHandle(raw);
    const sql = await getSql();
    const me = context.userId;
    const target = await sql<{ user_id: string }>`
      select user_id from profiles where handle = ${handle}
    `;
    if (!target[0]) throw new Error("Nobody with that handle");
    const them = target[0].user_id;
    if (them === me) throw new Error("That's you");
    if (await isBlocked(me, them)) throw new Error("Can't send that");

    const existing = await sql<{ status: string; requester_id: string }>`
      select status, requester_id from friendships
      where (requester_id = ${me} and addressee_id = ${them})
         or (requester_id = ${them} and addressee_id = ${me})
    `;
    if (existing[0]?.status === "accepted") return { ok: true as const };
    if (existing[0]?.status === "pending" && existing[0].requester_id === them) {
      await sql`
        update friendships set status = 'accepted'
        where requester_id = ${them} and addressee_id = ${me}
      `;
      return { ok: true as const };
    }
    if (existing[0]) return { ok: true as const };

    await sql`
      insert into friendships (requester_id, addressee_id, status)
      values (${me}, ${them}, 'pending')
    `;
    return { ok: true as const };
  });

export const acceptFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update friendships set status = 'accepted'
      where id = ${id} and addressee_id = ${context.userId} and status = 'pending'
    `;
    return { ok: true as const };
  });

export const declineFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      delete from friendships
      where id = ${id} and addressee_id = ${context.userId} and status = 'pending'
    `;
    return { ok: true as const };
  });

export const sendKiss = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { toUserId: string; kind: string; note?: string; count?: number }) => data)
  .handler(async ({ context, data }) => {
    const me = context.userId;
    const them = data.toUserId;
    if (them === me) throw new Error("Kiss someone else");
    if (!isKissKind(data.kind)) throw new Error("Unknown kiss");
    if (await isBlocked(me, them)) throw new Error("Can't send that");
    const n = Math.min(69, Math.max(1, Math.floor(data.count ?? 1)));
    const sql = await getSql();
    const target = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${them}`;
    if (!target[0]) throw new Error("They are not on KISS yet");
    const note = (data.note ?? "").trim().slice(0, 80);
    const inserted = await sql<{ id: number }>`
      insert into kisses (from_user_id, to_user_id, kind, note)
      select ${me}, ${them}, ${data.kind}, ${note}
      from generate_series(1, ${n})
      returning id
    `;
    const streak = await bumpStreak(me, them);
    return { id: Number(inserted[0]?.id), streak, kind: data.kind as KissKindId, count: n };
  });

export const catchKiss = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update kisses
      set caught_at = now()
      where id = ${id}
        and to_user_id = ${context.userId}
        and caught_at is null
    `;
    return { ok: true as const };
  });

export const setDisplayName = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((name: string) => name)
  .handler(async ({ context, data: raw }) => {
    const displayName = raw.trim().slice(0, 32);
    if (displayName.length < 2) throw new Error("Give yourself a name");
    const sql = await getSql();
    await sql`
      update profiles set display_name = ${displayName}
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const d = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return d;
  if (d.startsWith("00")) return d.slice(2);
  return d;
}

export const setPhone = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((phone: string) => phone)
  .handler(async ({ context, data: raw }) => {
    const phone = normalizePhone(raw);
    if (phone.length < 8 || phone.length > 15) throw new Error("Need a real phone number");
    const sql = await getSql();
    const taken = await sql<{ user_id: string }>`
      select user_id from profiles
      where phone = ${phone} and user_id <> ${context.userId}
    `;
    if (taken.length > 0) throw new Error("That number is already on KISS");
    await sql`
      update profiles set phone = ${phone}
      where user_id = ${context.userId}
    `;
    return { ok: true as const, phone };
  });

export const findByPhone = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((phone: string) => phone)
  .handler(async ({ context, data: raw }): Promise<PublicPerson | null> => {
    const phone = normalizePhone(raw);
    if (phone.length < 8) return null;
    const alt = phone.startsWith("0") ? phone.slice(1) : `0${phone}`;
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      handle: string;
      display_name: string;
      avatar_hue: number;
    }>`
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
      avatarHue: Number(rows[0].avatar_hue),
    };
  });

export const sendRandomKiss = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((kind: string) => kind)
  .handler(async ({ context, data: kind }) => {
    const me = context.userId;
    if (!isKissKind(kind)) throw new Error("Unknown kiss");
    const sql = await getSql();
    const meProfile = await sql<{ open_to_random: boolean }>`
      select open_to_random from profiles where user_id = ${me}
    `;
    if (!meProfile[0]?.open_to_random) {
      throw new Error("Turn on stranger kisses in your profile");
    }
    const used = await sql<{ n: number }>`
      select count(*)::int as n from kisses
      where from_user_id = ${me} and kind = 'random' and created_at::date = current_date
    `;
    if (Number(used[0]?.n ?? 0) >= 1) throw new Error("You already threw today's stranger kiss");

    const candidates = await sql<{ user_id: string; handle: string; display_name: string }>`
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
    const them = candidates[0].user_id;
    await sql`
      insert into kisses (from_user_id, to_user_id, kind, note)
      values (${me}, ${them}, 'random', ${kind})
    `;
    return {
      handle: candidates[0].handle,
      displayName: candidates[0].display_name,
      kind,
    };
  });

export const blockPerson = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ context, data: them }) => {
    if (them === context.userId) return { ok: true as const };
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
    return { ok: true as const };
  });
