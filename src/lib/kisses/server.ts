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

    let phoneInboxRows: Array<{
      id: number;
      from_phone: string;
      from_name: string;
      kind: string;
      n: number;
      created_at: string;
      caught_at: string | null;
    }> = [];
    if (profile?.phone) {
      phoneInboxRows = await sql<{
        id: number;
        from_phone: string;
        from_name: string;
        kind: string;
        n: number;
        created_at: string;
        caught_at: string | null;
      }>`
        select pk.id, pk.from_phone, pk.from_name, pk.kind, pk.n,
               pk.created_at::text as created_at,
               pk.caught_at::text as caught_at
        from phone_kisses pk
        where (pk.to_phone = ${profile.phone} 
           or right(pk.to_phone, 8) = right(${profile.phone}, 8)
           or (length(pk.to_phone) <= 8 and ${profile.phone} like '%' || pk.to_phone)
           or (length(${profile.phone}) <= 8 and pk.to_phone like '%' || ${profile.phone}))
        order by pk.created_at desc
        limit 40
      `.catch(() => []);
    }

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

    let phoneSentRows: Array<{
      id: number;
      to_phone: string;
      to_name: string;
      kind: string;
      n: number;
      created_at: string;
      caught_at: string | null;
    }> = [];
    if (profile?.phone) {
      phoneSentRows = await sql<{
        id: number;
        to_phone: string;
        to_name: string;
        kind: string;
        n: number;
        created_at: string;
        caught_at: string | null;
      }>`
        select pk.id, pk.to_phone,
               coalesce(
                 (select display_name from phone_book where right(phone, 8) = right(pk.to_phone, 8) limit 1),
                 pk.to_phone
               ) as to_name,
               pk.kind, pk.n,
               pk.created_at::text as created_at,
               pk.caught_at::text as caught_at
        from phone_kisses pk
        where (pk.from_phone = ${profile.phone} 
           or right(pk.from_phone, 8) = right(${profile.phone}, 8)
           or (length(pk.from_phone) <= 8 and ${profile.phone} like '%' || pk.from_phone)
           or (length(${profile.phone}) <= 8 and pk.from_phone like '%' || ${profile.phone}))
        order by pk.created_at desc
        limit 20
      `.catch(() => []);
    }

    const counts = await sql<{ sent: number; received: number; randoms: number; sent_all: number; received_all: number }>`
      select
        (select count(*)::int from kisses where from_user_id = ${me} and created_at::date = current_date) as sent,
        (select count(*)::int from kisses where to_user_id = ${me} and created_at::date = current_date) as received,
        (select count(*)::int from kisses where from_user_id = ${me} and kind = 'random' and created_at::date = current_date) as randoms,
        (select count(*)::int from kisses where from_user_id = ${me}) as sent_all,
        (select count(*)::int from kisses where to_user_id = ${me} and caught_at is not null) as received_all
    `;

    let phoneCountSent = 0;
    let phoneCountReceived = 0;
    let phoneCountSentAll = 0;
    let phoneCountReceivedAll = 0;
    if (profile?.phone) {
      const phoneCounts = await sql<{
        sent: number;
        received: number;
        sent_all: number;
        received_all: number;
      }>`
        select
          (select coalesce(sum(n), 0)::int from phone_kisses 
           where (from_phone = ${profile.phone} 
              or right(from_phone, 8) = right(${profile.phone}, 8)
              or (length(from_phone) <= 8 and ${profile.phone} like '%' || from_phone)
              or (length(${profile.phone}) <= 8 and from_phone like '%' || ${profile.phone}))
             and created_at::date = current_date) as sent,
          (select coalesce(sum(n), 0)::int from phone_kisses 
           where (to_phone = ${profile.phone} 
              or right(to_phone, 8) = right(${profile.phone}, 8)
              or (length(to_phone) <= 8 and ${profile.phone} like '%' || to_phone)
              or (length(${profile.phone}) <= 8 and to_phone like '%' || ${profile.phone}))
             and created_at::date = current_date) as received,
          (select coalesce(sum(n), 0)::int from phone_kisses 
           where (from_phone = ${profile.phone} 
              or right(from_phone, 8) = right(${profile.phone}, 8)
              or (length(from_phone) <= 8 and ${profile.phone} like '%' || from_phone)
              or (length(${profile.phone}) <= 8 and from_phone like '%' || ${profile.phone}))) as sent_all,
          (select coalesce(sum(n), 0)::int from phone_kisses 
           where (to_phone = ${profile.phone} 
              or right(to_phone, 8) = right(${profile.phone}, 8)
              or (length(to_phone) <= 8 and ${profile.phone} like '%' || to_phone)
              or (length(${profile.phone}) <= 8 and to_phone like '%' || ${profile.phone}))
             and caught_at is not null) as received_all
      `.catch(() => [{ sent: 0, received: 0, sent_all: 0, received_all: 0 }]);
      phoneCountSent = Number(phoneCounts[0]?.sent ?? 0);
      phoneCountReceived = Number(phoneCounts[0]?.received ?? 0);
      phoneCountSentAll = Number(phoneCounts[0]?.sent_all ?? 0);
      phoneCountReceivedAll = Number(phoneCounts[0]?.received_all ?? 0);
    }

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

    const inbox: KissRow[] = [
      ...inboxRows.map((r) => ({
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
      })),
      ...phoneInboxRows.map((r) => ({
        id: Number(r.id) + 1000000,
        fromUserId: `p:${r.from_phone}`,
        toUserId: me,
        kind: r.kind,
        note: "",
        createdAt: r.created_at,
        caughtAt: r.caught_at,
        fromHandle: r.from_phone.slice(-4),
        fromName: r.from_name,
        fromHue: Math.abs(hashCode(r.from_phone)) % 360,
      })),
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)).slice(0, 40);

    const sent: SentKiss[] = [
      ...sentRows.map((r) => ({
        id: Number(r.id),
        toUserId: r.to_user_id,
        toName: r.to_name,
        toHandle: r.to_handle,
        caught: Boolean(r.caught_at),
        createdAt: r.created_at,
      })),
      ...phoneSentRows.map((r) => ({
        id: Number(r.id) + 1000000,
        toUserId: `p:${r.to_phone}`,
        toName: r.to_name,
        toHandle: r.to_phone.slice(-4),
        caught: Boolean(r.caught_at),
        createdAt: r.created_at,
      })),
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)).slice(0, 20);

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
      sentToday: Number(counts[0]?.sent ?? 0) + phoneCountSent,
      receivedToday: Number(counts[0]?.received ?? 0) + phoneCountReceived,
      sentAll: Number(counts[0]?.sent_all ?? 0) + phoneCountSentAll,
      receivedAll: Number(counts[0]?.received_all ?? 0) + phoneCountReceivedAll,
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
            and lower(display_name) not in ('you', 'someone')
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
            and lower(display_name) not in ('you', 'someone')
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
        and lower(display_name) not in ('you', 'someone')
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
    if (id >= 1000000) {
      const phoneId = id - 1000000;
      await sql`
        update phone_kisses
        set caught_at = now()
        where id = ${phoneId}
          and caught_at is null
      `.catch(() => undefined);
    } else {
      await sql`
        update kisses
        set caught_at = now()
        where id = ${id}
          and to_user_id = ${context.userId}
          and caught_at is null
      `;
    }
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
  let d = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    /* already international digits */
  } else if (d.startsWith("00")) {
    d = d.slice(2);
  } else if (d.startsWith("0") && d.length === 10) {
    d = `972${d.slice(1)}`;
  } else if (d.startsWith("555") && d.length >= 4 && d.length <= 10) {
    d = `972${d}`;
  } else if (!d.startsWith("972") && d.length >= 4 && d.length <= 7) {
    d = `972555${d}`;
  }
  return d;
}

function last8(phone: string): string {
  return phone.slice(-8);
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

const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

function mintCode(): string {
  let out = "";
  for (let i = 0; i < 5; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

async function findPhoto(
  sql: Awaited<ReturnType<typeof getSql>>,
  phone?: string | null,
  name?: string | null,
): Promise<string | null> {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length >= 7) {
    const rows = await sql<{ photo: string | null }>`
      select photo from phone_book
      where photo is not null and right(phone, 8) = ${digits.slice(-8)}
      limit 1
    `;
    if (rows[0]?.photo) return rows[0].photo;
  }
  const who = (name ?? "").trim().toLowerCase();
  if (who.length >= 2) {
    const rows = await sql<{ photo: string | null }>`
      select photo from phone_book
      where photo is not null and lower(display_name) = ${who}
      limit 1
    `;
    if (rows[0]?.photo) return rows[0].photo;
    const like = `%${who}%`;
    const fuzzy = await sql<{ photo: string | null }>`
      select photo from phone_book
      where photo is not null and lower(display_name) like ${like}
      limit 1
    `;
    if (fuzzy[0]?.photo) return fuzzy[0].photo;
  }
  return null;
}

export const createShareLink = createServerFn({ method: "POST" })
  .validator((data: { fromName: string; toPhone?: string; fromPhone?: string; card?: string | null }) => data)
  .handler(async ({ data }): Promise<{ code: string }> => {
    const fromName = data.fromName.trim().slice(0, 32) || "Someone";
    const toPhone = (data.toPhone ?? "").replace(/\D/g, "").slice(0, 15) || null;
    const fromPhone = (data.fromPhone ?? "").replace(/\D/g, "").slice(0, 15) || null;
    const rawCard = data.card ?? "";
    const card = rawCard.startsWith("data:image") ? rawCard.slice(0, 350000) : null;
    const sql = await getSql();
    for (let i = 0; i < 8; i += 1) {
      const code = mintCode();
      try {
        await sql`
          insert into share_links (code, from_name, to_phone, from_phone, card)
          values (${code}, ${fromName}, ${toPhone}, ${fromPhone}, ${card})
        `;
      } catch {
        try {
          await sql`
            insert into share_links (code, from_name, to_phone, from_phone)
            values (${code}, ${fromName}, ${toPhone}, ${fromPhone})
          `;
        } catch {
          try {
            await sql`
              insert into share_links (code, from_name, to_phone)
              values (${code}, ${fromName}, ${toPhone})
            `;
          } catch {
            continue;
          }
        }
      }
      if (card) {
        try {
          await sql`
            insert into share_cards (code, body)
            values (${code}, ${card})
            on conflict (code) do update set body = excluded.body
          `;
        } catch {
          /* share_cards may not exist yet */
        }
      }
      return { code };
    }
    throw new Error("Could not make link");
  });

export const resolveShareLink = createServerFn({ method: "GET" })
  .validator((code: string) => code)
  .handler(async ({ data: raw }): Promise<{ fromName: string; toPhone: string | null; code: string; fromPhoto: string | null } | null> => {
    const code = raw.trim().toLowerCase().slice(0, 8);
    if (!/^[a-z0-9]{4,8}$/.test(code)) return null;
    const sql = await getSql();
    let row: { from_name: string; to_phone: string | null; from_phone?: string | null } | undefined;
    try {
      row = (
        await sql<{ from_name: string; to_phone: string | null; from_phone: string | null }>`
          select from_name, to_phone, from_phone from share_links where code = ${code}
        `
      )[0];
    } catch {
      row = (
        await sql<{ from_name: string; to_phone: string | null }>`
          select from_name, to_phone from share_links where code = ${code}
        `
      )[0];
    }
    if (!row) return null;
    const fromPhoto = await findPhoto(sql, row.from_phone ?? null, row.from_name);
    return { fromName: row.from_name, toPhone: row.to_phone, code, fromPhoto };
  });

export const getShareCard = createServerFn({ method: "GET" })
  .validator((code: string) => code)
  .handler(async ({ data: raw }): Promise<string | null> => {
    const code = raw.trim().toLowerCase().slice(0, 8);
    if (!/^[a-z0-9]{4,8}$/.test(code)) return null;
    const sql = await getSql();
    try {
      const stored = await sql<{ body: string }>`
        select body from share_cards where code = ${code} limit 1
      `;
      if (stored[0]?.body?.startsWith("data:image")) return stored[0].body;
    } catch {
      /* table missing */
    }
    try {
      const rows = await sql<{ card: string | null; from_phone: string | null; from_name: string }>`
        select card, from_phone, from_name from share_links where code = ${code}
      `;
      const row = rows[0];
      if (row?.card?.startsWith("data:image")) return row.card;
      const photo = await findPhoto(sql, row?.from_phone ?? null, row?.from_name ?? null);
      return photo;
    } catch {
      return null;
    }
  });

function bookPerson(
  phone: string,
  displayName: string,
  lastSeen?: string | null,
  photo?: string | null,
): PublicPerson {
  return {
    userId: `p:${phone}`,
    handle: phone.slice(-4),
    displayName: displayName || phone,
    avatarHue: Math.abs(hashCode(phone)) % 360,
    lastSeen: lastSeen ?? null,
    phone,
    photo: photo || null,
  };
}

export const registerPhone = createServerFn({ method: "POST" })
  .validator((data: { phone: string; name?: string; photo?: string | null }) => data)
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    if (phone.length < 8 || phone.length > 15) throw new Error("Need a real phone number");
    const name = (data.name ?? "").trim().slice(0, 32);
    const rawPhoto = data.photo ?? "";
    const photo = rawPhoto.startsWith("data:image") ? rawPhoto.slice(0, 120000) : null;
    const sql = await getSql();
    await sql`
      insert into phone_book (phone, display_name, photo, last_seen)
      values (${phone}, ${name}, ${photo}, now())
      on conflict (phone) do update set
        display_name = case
          when excluded.display_name <> '' then excluded.display_name
          else phone_book.display_name
        end,
        photo = coalesce(excluded.photo, phone_book.photo),
        last_seen = now()
    `;
    return { ok: true as const, phone };
  });

export const searchDirectory = createServerFn({ method: "POST" })
  .validator((data: { q: string; myPhone?: string }) => data)
  .handler(async ({ data }): Promise<PublicPerson[]> => {
    const raw = data.q.trim();
    const qName = raw.toLowerCase().replace(/[%_+]/g, " ").replace(/\s+/g, " ").trim();
    const digits = raw.replace(/\D/g, "");
    const lookingPhone = digits.length >= 3;
    const mine = (data.myPhone ?? "").replace(/\D/g, "");
    const mineTail = mine.slice(-8);
    const sql = await getSql();
    let book: Array<Record<string, unknown>> = [];
    try {
      book = await sql.query("select * from phone_book order by last_seen desc nulls last limit 300");
    } catch {
      book = [];
    }
    let profiles: Array<Record<string, unknown>> = [];
    try {
      profiles = await sql.query(
        "select user_id, phone, display_name, last_seen from profiles where coalesce(display_name,'') <> '' limit 400",
      );
    } catch {
      profiles = [];
    }
    const seen = new Set<string>();
    const out: PublicPerson[] = [];
    const qTok = qName.split(/[\s.]+/).filter(Boolean);
    function nameHit(name: string): boolean {
      if (!qName) return true;
      const n = name.toLowerCase();
      if (n.includes(qName)) return true;
      const nTok = n.split(/[\s.]+/).filter(Boolean);
      return qTok.every((t) => nTok.some((nt) => nt.startsWith(t) || nt.includes(t)));
    }
    function phoneHit(phone: string): boolean {
      if (!lookingPhone) return false;
      const their = phone.replace(/\D/g, "");
      if (!their) return false;
      return their.includes(digits) || digits.includes(their.slice(-Math.min(8, their.length)));
    }
    for (const r of [...book, ...profiles]) {
      const phoneRaw = String(r.phone ?? "");
      const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
      const name = String(r.display_name ?? "").trim();
      if (/^you$|^someone$/i.test(name)) continue;
      const key = phone.replace(/\D/g, "").slice(-8) || `n:${name.toLowerCase()}`;
      if (seen.has(key)) continue;
      if (mineTail.length >= 7 && key === mineTail) continue;
      if (qName || lookingPhone) {
        if (!(name && nameHit(name)) && !phoneHit(phone)) continue;
      }
      if (!name && !phone) continue;
      seen.add(key);
      const wantPhoto = qName.length >= 2 || lookingPhone;
      const photo =
        wantPhoto && typeof r.photo === "string" && r.photo.startsWith("data:") ? r.photo : null;
      const uid = typeof r.user_id === "string" ? r.user_id : `p:${phone || name}`;
      out.push({
        userId: uid,
        handle: phone.slice(-4) || name.slice(0, 4),
        displayName: name || phone,
        avatarHue: Math.abs(hashCode(phone || name)) % 360,
        lastSeen: r.last_seen ? String(r.last_seen) : null,
        phone: phone || undefined,
        photo,
      });
    }
    if (mineTail.length >= 7) {
      try {
        const blocked = await sql<{ blocked_phone: string }>`
          select blocked_phone from phone_blocks
          where right(blocker_phone, 8) = ${mineTail}
        `;
        const hide = new Set(blocked.map((b) => b.blocked_phone.replace(/\D/g, "").slice(-8)));
        return out.filter((p) => !hide.has((p.phone ?? "").replace(/\D/g, "").slice(-8))).slice(0, 50);
      } catch {
        /* table missing */
      }
    }
    return out.slice(0, 50);
  });

export const sendPhoneKiss = createServerFn({ method: "POST" })
  .validator((data: { fromPhone: string; fromName: string; toPhone: string; count?: number; kind?: string }) => data)
  .handler(async ({ data }) => {
    const fromPhone = normalizePhone(data.fromPhone);
    const toPhone = normalizePhone(data.toPhone);
    if (fromPhone.length < 8 || toPhone.length < 8) throw new Error("Need both numbers");
    if (fromPhone === toPhone) throw new Error("Kiss someone else");
    const fromName = data.fromName.trim().slice(0, 32) || "Someone";
    const n = Math.min(69, Math.max(1, Math.floor(data.count ?? 1)));
    const kind = isKissKind(data.kind ?? "classic") ? (data.kind ?? "classic") : "classic";
    const sql = await getSql();
    const tail = toPhone.slice(-8);
    const target = await sql<{ phone: string; display_name: string }>`
      select phone, display_name from phone_book
      where phone = ${toPhone} or right(phone, 8) = ${tail}
      limit 1
    `;
    const fromProfiles =
      target[0]
        ? []
        : await sql<{ phone: string; display_name: string }>`
            select phone, display_name from profiles
            where phone is not null and (phone = ${toPhone} or right(phone, 8) = ${tail})
            limit 1
          `;
    const hit = target[0] ?? fromProfiles[0];
    if (!hit) throw new Error("They are not on KISS yet");
    const to = normalizePhone(hit.phone);
    const blocked = await sql<{ n: number }>`
      select 1 as n from phone_blocks
      where right(blocker_phone, 8) = ${to.slice(-8)}
        and right(blocked_phone, 8) = ${fromPhone.slice(-8)}
      limit 1
    `.catch(() => [] as Array<{ n: number }>);
    if (blocked.length > 0) {
      return { id: 0, count: n, toName: hit.display_name || to, toPhone: to };
    }
    const inserted = await sql<{ id: number }>`
      insert into phone_kisses (from_phone, from_name, to_phone, kind, n)
      values (${fromPhone}, ${fromName}, ${to}, ${kind}, ${n})
      returning id
    `;
    await sql`
      insert into phone_book (phone, display_name, last_seen)
      values (${fromPhone}, ${fromName}, now())
      on conflict (phone) do update set last_seen = now()
    `;
    return {
      id: Number(inserted[0]?.id),
      count: n,
      toName: hit.display_name || to,
      toPhone: to,
    };
  });

export const phoneInbox = createServerFn({ method: "POST" })
  .validator((phone: string) => phone)
  .handler(async ({ data: raw }) => {
    const phone = normalizePhone(raw);
    if (phone.length < 8) return [];
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      from_phone: string;
      from_name: string;
      kind: string;
      n: number;
      created_at: string;
      photo: string | null;
    }>`
      select pk.id, pk.from_phone, pk.from_name, pk.kind, pk.n, pk.created_at::text as created_at,
        (
          select photo from phone_book
          where photo is not null and right(phone, 8) = right(pk.from_phone, 8)
          limit 1
        ) as photo
      from phone_kisses pk
      where (pk.to_phone = ${phone} 
         or right(pk.to_phone, 8) = right(${phone}, 8)
         or (length(pk.to_phone) <= 8 and ${phone} like '%' || pk.to_phone)
         or (length(${phone}) <= 8 and pk.to_phone like '%' || ${phone}))
        and pk.caught_at is null
      order by pk.created_at desc
      limit 30
    `;
    const mapped = rows.map((r) => ({
      id: Number(r.id),
      fromPhone: r.from_phone,
      fromName: r.from_name,
      kind: r.kind,
      count: Number(r.n) || 1,
      createdAt: r.created_at,
      photo: r.photo && r.photo.startsWith("data:") ? r.photo : null,
    }));
    let hide = new Set<string>();
    try {
      const blocked = await sql<{ blocked_phone: string }>`
        select blocked_phone from phone_blocks
        where right(blocker_phone, 8) = ${phone.slice(-8)}
      `;
      hide = new Set(blocked.map((b) => b.blocked_phone.replace(/\D/g, "").slice(-8)));
    } catch {
      hide = new Set();
    }
    return mapped.filter((r) => !hide.has(r.fromPhone.replace(/\D/g, "").slice(-8)));
  });

export const catchPhoneKiss = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    await sql`update phone_kisses set caught_at = now() where id = ${id} and caught_at is null`;
    return { ok: true as const };
  });

export type StreamKiss = {
  id: string;
  from: string;
  to: string;
  count: number;
  kind: string;
  at: string;
};

function shortName(raw: string): string {
  const n = raw.trim().replace(/\s+/g, " ");
  if (!n || /^someone$|^you$/i.test(n)) return "Someone";
  const parts = n.split(" ");
  if (parts.length === 1) return parts[0]!.slice(0, 16);
  return `${parts[0]} ${parts[1]![0]}.`.slice(0, 18);
}

export const kissStream = createServerFn({ method: "GET" }).handler(async (): Promise<StreamKiss[]> => {
  const sql = await getSql();
  const phoneRows = await sql<{
    id: number;
    from_name: string;
    to_name: string | null;
    n: number;
    kind: string;
    created_at: string;
  }>`
    select
      pk.id,
      pk.from_name,
      (
        select display_name from phone_book
        where right(phone, 8) = right(pk.to_phone, 8)
        limit 1
      ) as to_name,
      pk.n,
      pk.kind,
      pk.created_at::text as created_at
    from phone_kisses pk
    order by pk.created_at desc
    limit 80
  `;
  let logged: Array<{
    id: number;
    from_name: string;
    to_name: string;
    kind: string;
    created_at: string;
  }> = [];
  try {
    logged = await sql`
      select k.id, fp.display_name as from_name, tp.display_name as to_name, k.kind, k.created_at::text as created_at
      from kisses k
      join profiles fp on fp.user_id = k.from_user_id
      join profiles tp on tp.user_id = k.to_user_id
      order by k.created_at desc
      limit 40
    `;
  } catch {
    logged = [];
  }
  const out: StreamKiss[] = [
    ...phoneRows.map((r) => ({
      id: `p${r.id}`,
      from: shortName(r.from_name),
      to: shortName(r.to_name || "Someone"),
      count: Number(r.n) || 1,
      kind: r.kind,
      at: r.created_at,
    })),
    ...logged.map((r) => ({
      id: `u${r.id}`,
      from: shortName(r.from_name),
      to: shortName(r.to_name),
      count: 1,
      kind: r.kind,
      at: r.created_at,
    })),
  ];
  out.sort((a, b) => (a.at < b.at ? 1 : -1));
  return out.slice(0, 80);
});

export const lookupFace = createServerFn({ method: "POST" })
  .validator((data: { name?: string; phone?: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const photo = await findPhoto(sql, data.phone ?? null, data.name ?? null);
    let name = "";
    const digits = (data.phone ?? "").replace(/\D/g, "");
    if (digits.length >= 7) {
      const rows = await sql<{ display_name: string }>`
        select display_name from phone_book
        where right(phone, 8) = ${digits.slice(-8)}
        limit 1
      `.catch(() => []);
      name = rows[0]?.display_name?.trim() || "";
    }
    return { photo, name, exists: Boolean(name || photo) };
  });

export const blockPhone = createServerFn({ method: "POST" })
  .validator((data: { myPhone: string; theirPhone?: string; theirName?: string }) => data)
  .handler(async ({ data }) => {
    const me = normalizePhone(data.myPhone);
    const them = normalizePhone(data.theirPhone ?? "");
    if (me.length < 8 || them.length < 8) return { ok: true as const };
    if (me.slice(-8) === them.slice(-8)) return { ok: true as const };
    const name = (data.theirName ?? "").trim().slice(0, 32);
    const sql = await getSql();
    await sql`
      insert into phone_blocks (blocker_phone, blocked_phone, blocked_name)
      values (${me}, ${them}, ${name})
      on conflict do nothing
    `;
    return { ok: true as const };
  });

export const unblockPhone = createServerFn({ method: "POST" })
  .validator((data: { myPhone: string; theirPhone: string }) => data)
  .handler(async ({ data }) => {
    const me = normalizePhone(data.myPhone);
    const them = normalizePhone(data.theirPhone);
    if (me.length < 8 || them.length < 8) return { ok: true as const };
    const sql = await getSql();
    await sql`
      delete from phone_blocks
      where right(blocker_phone, 8) = ${me.slice(-8)}
        and right(blocked_phone, 8) = ${them.slice(-8)}
    `;
    return { ok: true as const };
  });

export const listBlocks = createServerFn({ method: "POST" })
  .validator((myPhone: string) => myPhone)
  .handler(async ({ data: raw }) => {
    const me = normalizePhone(raw);
    if (me.length < 8) return [];
    const sql = await getSql();
    try {
      const rows = await sql<{ blocked_phone: string; blocked_name: string }>`
        select blocked_phone, blocked_name from phone_blocks
        where right(blocker_phone, 8) = ${me.slice(-8)}
        order by created_at desc
      `;
      return rows.map((r) => ({ tel: r.blocked_phone, name: r.blocked_name || r.blocked_phone }));
    } catch {
      return [];
    }
  });

export const saveNick = createServerFn({ method: "POST" })
  .validator((data: { myPhone: string; myName?: string; theirPhone: string; nick: string }) => data)
  .handler(async ({ data }) => {
    const me = normalizePhone(data.myPhone);
    const them = normalizePhone(data.theirPhone);
    const nick = data.nick.trim().slice(0, 24);
    if (me.length < 8 || them.length < 8 || !nick) return { ok: true as const };
    const sql = await getSql();
    await sql`
      insert into phone_nicks (owner_phone, target_phone, nick, owner_name)
      values (${me}, ${them}, ${nick}, ${(data.myName ?? "").slice(0, 32)})
      on conflict (owner_phone, target_phone) do update set nick = excluded.nick, owner_name = excluded.owner_name
    `;
    return { ok: true as const };
  });

export const listNicks = createServerFn({ method: "POST" })
  .validator((myPhone: string) => myPhone)
  .handler(async ({ data: raw }): Promise<Array<{ from: string; nick: string }>> => {
    const me = normalizePhone(raw);
    if (me.length < 8) return [];
    const sql = await getSql();
    try {
      const rows = await sql<{ owner_name: string; nick: string }>`
        select owner_name, nick from phone_nicks
        where right(target_phone, 8) = ${me.slice(-8)}
        order by created_at desc
        limit 24
      `;
      return rows.map((r) => ({ from: r.owner_name || "Someone", nick: r.nick }));
    } catch {
      return [];
    }
  });


