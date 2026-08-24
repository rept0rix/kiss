create table if not exists share_links (
  code text primary key,
  from_name text not null,
  to_phone text,
  created_at timestamptz default now()
);
