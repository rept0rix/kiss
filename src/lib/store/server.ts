import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { MIN_PHONE_DIGITS, normalizePhone } from "@/lib/phone";

const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

function mintCode(): string {
  let out = "";
  for (let i = 0; i < 5; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/** Get or create a QR code for a phone identity. */
export const getQrCode = createServerFn({ method: "POST" })
  .validator((data: { phone: string; name?: string }) => data)
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    if (phone.length < MIN_PHONE_DIGITS) return { code: null as string | null };
    const sql = await getSql();

    // Check for existing code
    const existing = await sql<{ code: string }>`
      select code from qr_codes where phone = ${phone} limit 1
    `.catch(() => []);
    if (existing[0]) return { code: existing[0].code };

    // Mint a new unique code
    for (let i = 0; i < 8; i += 1) {
      const code = mintCode();
      try {
        await sql`
          insert into qr_codes (code, phone, display_name)
          values (${code}, ${phone}, ${data.name ?? ""})
        `;
        return { code };
      } catch {
        // collision — retry
      }
    }
    return { code: null };
  });

/** Resolve a QR code to a person (for the scanner). */
export const resolveQrCode = createServerFn({ method: "GET" })
  .validator((code: string) => code)
  .handler(async ({ data: raw }) => {
    const code = raw.trim().toLowerCase().slice(0, 8);
    if (!/^[a-z0-9]{4,8}$/.test(code)) return null;
    const sql = await getSql();
    const rows = await sql<{ phone: string; display_name: string }>`
      select phone, display_name from qr_codes where code = ${code} limit 1
    `.catch(() => []);
    if (!rows[0]) return null;
    return {
      phone: rows[0].phone,
      name: rows[0].display_name || "Someone",
    };
  });

// --- Premium skins ---

export const PREMIUM_SKINS = [
  { id: "aurora", name: "Aurora", price: "$1.99", color: "#00ffaa" },
  { id: "sunset", name: "Sunset", price: "$1.99", color: "#ff9a3c" },
  { id: "neon", name: "Neon", price: "$1.99", color: "#ff00ff" },
  { id: "crystal", name: "Crystal", price: "$2.99", color: "#a8e6ff" },
  { id: "candy", name: "Candy", price: "$1.99", color: "#ff80ab" },
] as const;

export type PremiumSkin = (typeof PREMIUM_SKINS)[number];

export const getOwnedSkins = createServerFn({ method: "POST" })
  .validator((phone: string) => phone)
  .handler(async ({ data: raw }) => {
    const phone = normalizePhone(raw);
    if (phone.length < MIN_PHONE_DIGITS) return [] as string[];
    const sql = await getSql();
    const rows = await sql<{ skin: string }>`
      select skin from owned_skins where phone = ${phone}
    `.catch(() => []);
    return rows.map((r) => r.skin);
  });

export const grantSkin = createServerFn({ method: "POST" })
  .validator((data: { phone: string; skin: string }) => data)
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const skin = data.skin.trim().slice(0, 20);
    if (phone.length < MIN_PHONE_DIGITS || !skin) return { ok: false as const };
    const sql = await getSql();
    await sql`
      insert into owned_skins (phone, skin)
      values (${phone}, ${skin})
      on conflict do nothing
    `.catch(() => undefined);
    return { ok: true as const };
  });

// --- Super Kiss balance ---

export const getSuperBalance = createServerFn({ method: "POST" })
  .validator((phone: string) => phone)
  .handler(async ({ data: raw }) => {
    const phone = normalizePhone(raw);
    if (phone.length < MIN_PHONE_DIGITS) return { balance: 1, dailyGranted: false };
    const sql = await getSql();
    const today = new Date().toISOString().slice(0, 10);
    const rows = await sql<{ balance: number; last_daily_grant: string }>`
      select balance, last_daily_grant::text as last_daily_grant
      from super_balance where phone = ${phone}
    `.catch(() => []);

    if (!rows[0]) {
      // Initialize with daily grant
      await sql`
        insert into super_balance (phone, balance, last_daily_grant)
        values (${phone}, 1, ${today}::date)
        on conflict do nothing
      `.catch(() => undefined);
      return { balance: 1, dailyGranted: true };
    }

    const lastGrant = rows[0].last_daily_grant?.slice(0, 10) ?? "";
    if (lastGrant !== today) {
      const newBalance = Number(rows[0].balance) + 1;
      await sql`
        update super_balance set balance = ${newBalance}, last_daily_grant = ${today}::date
        where phone = ${phone}
      `.catch(() => undefined);
      return { balance: newBalance, dailyGranted: true };
    }
    return { balance: Number(rows[0].balance), dailyGranted: false };
  });

export const consumeSuperKiss = createServerFn({ method: "POST" })
  .validator((phone: string) => phone)
  .handler(async ({ data: raw }) => {
    const phone = normalizePhone(raw);
    if (phone.length < MIN_PHONE_DIGITS) return { ok: false as const };
    const sql = await getSql();
    const rows = await sql<{ balance: number }>`
      select balance from super_balance where phone = ${phone}
    `.catch(() => []);
    const balance = Number(rows[0]?.balance ?? 1);
    if (balance <= 0) return { ok: false as const };
    await sql`
      update super_balance set balance = ${balance - 1}
      where phone = ${phone}
    `.catch(() => undefined);
    return { ok: true as const };
  });

export const grantSuperKisses = createServerFn({ method: "POST" })
  .validator((data: { phone: string; count: number }) => data)
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    if (phone.length < MIN_PHONE_DIGITS || data.count <= 0) return { ok: false as const };
    const sql = await getSql();
    const rows = await sql<{ balance: number }>`
      select balance from super_balance where phone = ${phone}
    `.catch(() => []);
    if (rows[0]) {
      await sql`
        update super_balance set balance = ${Number(rows[0].balance) + data.count}
        where phone = ${phone}
      `.catch(() => undefined);
    } else {
      await sql`
        insert into super_balance (phone, balance, last_daily_grant)
        values (${phone}, ${data.count}, '1970-01-01'::date)
        on conflict do nothing
      `.catch(() => undefined);
    }
    return { ok: true as const };
  });

// --- Invitation tracking ---

export const createInvitation = createServerFn({ method: "POST" })
  .validator((data: { inviterPhone: string; code: string }) => data)
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.inviterPhone);
    const code = data.code.trim().slice(0, 8);
    if (phone.length < MIN_PHONE_DIGITS || !code) return { ok: false as const };
    const sql = await getSql();
    await sql`
      insert into invitations (code, inviter_phone)
      values (${code}, ${phone})
      on conflict do nothing
    `.catch(() => undefined);
    return { ok: true as const };
  });

export const recordInvitee = createServerFn({ method: "POST" })
  .validator((data: { code: string; inviteePhone: string }) => data)
  .handler(async ({ data }) => {
    const code = data.code.trim().slice(0, 8);
    const phone = normalizePhone(data.inviteePhone);
    if (phone.length < MIN_PHONE_DIGITS || !code) return { rewarded: false };
    const sql = await getSql();
    const rows = await sql<{ inviter_phone: string; rewarded: boolean }>`
      select inviter_phone, rewarded from invitations where code = ${code}
    `.catch(() => []);
    if (!rows[0] || rows[0].rewarded) return { rewarded: false };

    // Mark the invitation and grant both users a bonus Super Kiss
    await sql`
      update invitations set invitee_phone = ${phone}, rewarded = true
      where code = ${code} and rewarded = false
    `.catch(() => undefined);

    const inviter = rows[0].inviter_phone;
    for (const p of [inviter, phone]) {
      const bal = await sql<{ balance: number }>`
        select balance from super_balance where phone = ${p}
      `.catch(() => []);
      if (bal[0]) {
        await sql`
          update super_balance set balance = ${Number(bal[0].balance) + 1}
          where phone = ${p}
        `.catch(() => undefined);
      } else {
        await sql`
          insert into super_balance (phone, balance, last_daily_grant)
          values (${p}, 1, '1970-01-01'::date)
          on conflict do nothing
        `.catch(() => undefined);
      }
    }
    return { rewarded: true };
  });
