-- 0020_phone_privacy_and_shares.sql
-- Privacy controls for phone numbers:
-- Numbers of unknown contacts / strangers are masked by default.
-- Users can request to reveal/exchange phone numbers, and approvals grant full number visibility.

create table if not exists phone_share_requests (
  id serial primary key,
  from_phone text not null,
  from_name text,
  to_phone text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(from_phone, to_phone)
);

create index if not exists phone_share_requests_from_idx on phone_share_requests (from_phone);
create index if not exists phone_share_requests_to_idx on phone_share_requests (to_phone);
