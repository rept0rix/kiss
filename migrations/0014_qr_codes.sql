-- Personal QR codes: a short per-user code for sharing.
-- Each phone identity gets one stable code so /q/{code} resolves to them.
create table if not exists qr_codes (
  code text primary key,
  phone text not null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists qr_codes_phone_idx on qr_codes (phone);
