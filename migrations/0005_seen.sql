alter table profiles add column if not exists last_seen timestamptz;
create index if not exists profiles_last_seen_idx on profiles (last_seen desc);
