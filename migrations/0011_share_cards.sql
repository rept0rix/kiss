create table if not exists share_cards (
  code text primary key,
  body text not null,
  created_at timestamptz not null default now()
);
