-- 0019_social_and_global_kisses.sql
-- Enables claiming kisses sent via social handles (Instagram, TikTok, X, LinkedIn, Telegram, Facebook)
-- and handling global / universe kisses sent to random strangers.

create table if not exists social_claims (
  handle text not null,
  platform text not null,
  claimed_phone text,
  claimed_name text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (platform, handle)
);

create index if not exists social_claims_claimed_phone_idx on social_claims (claimed_phone);
