create table if not exists phone_blocks (
  blocker_phone text not null,
  blocked_phone text not null,
  blocked_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (blocker_phone, blocked_phone)
);
create index if not exists phone_blocks_blocker_idx on phone_blocks (blocker_phone);
