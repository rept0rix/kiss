-- Super Kiss balance for phone identities (purchased + daily grants).
create table if not exists super_balance (
  phone text primary key,
  balance int not null default 1,
  last_daily_grant date not null default '1970-01-01'::date
);
