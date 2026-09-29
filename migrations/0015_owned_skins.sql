-- Premium skins owned by a phone identity (purchased via in-app purchase).
create table if not exists owned_skins (
  phone text not null,
  skin text not null,
  purchased_at timestamptz not null default now(),
  primary key (phone, skin)
);
