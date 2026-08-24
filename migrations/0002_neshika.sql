create table if not exists profiles (
  user_id text primary key,
  handle text not null unique,
  display_name text not null,
  bio text not null default '',
  avatar_hue integer not null default 12,
  open_to_random boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists profiles_handle_idx on profiles (handle);

create table if not exists friendships (
  id serial primary key,
  requester_id text not null,
  addressee_id text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);
create index if not exists friendships_addressee_idx on friendships (addressee_id);
create index if not exists friendships_requester_idx on friendships (requester_id);

create table if not exists kisses (
  id serial primary key,
  from_user_id text not null,
  to_user_id text not null,
  kind text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists kisses_to_user_idx on kisses (to_user_id, created_at desc);
create index if not exists kisses_from_user_idx on kisses (from_user_id, created_at desc);
create index if not exists kisses_pair_day_idx on kisses (from_user_id, to_user_id, created_at);

create table if not exists streaks (
  user_low text not null,
  user_high text not null,
  count integer not null default 0,
  last_date date not null,
  primary key (user_low, user_high)
);

create table if not exists blocks (
  blocker_id text not null,
  blocked_id text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
