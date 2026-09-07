-- One definition of "same phone" for every phone_book / phone_kisses /
-- phone_blocks query. Mirrors phonesMatch() in src/lib/phone.ts.
--
-- Two identities match when they are equal, or when their trailing digits
-- agree: compare the last min(length(a), length(b), 8) digits, never fewer
-- than 4. So the QA identity '1234' resolves to the stored '15550001234',
-- '5550001234' matches '15550001234' (missing country code), and two real
-- numbers that differ anywhere in their last 8 digits stay distinct.
create or replace function phone_match(a text, b text) returns boolean
language sql immutable strict as $$
  select a = b
      or (
        length(a) >= 4 and length(b) >= 4
        and right(a, least(length(a), length(b), 8))
          = right(b, least(length(a), length(b), 8))
      )
$$;
