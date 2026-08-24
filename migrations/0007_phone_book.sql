create table if not exists phone_book (
  phone text primary key,
  display_name text not null default '',
  last_seen timestamptz default now()
);

create table if not exists phone_kisses (
  id serial primary key,
  from_phone text not null,
  from_name text not null,
  to_phone text not null,
  kind text not null default 'classic',
  n int not null default 1,
  created_at timestamptz default now(),
  caught_at timestamptz
);

create index if not exists phone_kisses_inbox_idx on phone_kisses (to_phone, created_at desc);
