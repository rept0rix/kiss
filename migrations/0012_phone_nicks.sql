create table if not exists phone_nicks (
  owner_phone text not null,
  target_phone text not null,
  nick text not null,
  owner_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (owner_phone, target_phone)
);
