-- Invitation rewards: track who invited whom via /k/{code} links.
create table if not exists invitations (
  code text primary key,
  inviter_phone text not null,
  invitee_phone text,
  rewarded boolean not null default false,
  created_at timestamptz not null default now()
);
