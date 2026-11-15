-- Saugumo taisyklių ir susiejimo testai paprastame PostgreSQL.
-- Paleidžiama po 00_stub_auth.sql ir migracijų (žr. .github/workflows/ci.yml).
-- Bet kuri klaida reiškia, kad testas nepavyko.
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null

reset role;

-- A = Ona (pagalbininkė), B = Jonas (antras pagalbininkas), C = Petras (svetimas),
-- S = mamos telefonas (anonimiškas), T = kito senjoro telefonas.
\set A '''00000000-0000-0000-0000-00000000000a'''
\set B '''00000000-0000-0000-0000-00000000000b'''
\set C '''00000000-0000-0000-0000-00000000000c'''
\set S '''00000000-0000-0000-0000-0000000000e1'''
\set T '''00000000-0000-0000-0000-0000000000e2'''

insert into auth.users (id) values (:A), (:B), (:C), (:S), (:T);

create function pg_temp.check(cond boolean, what text) returns void
language plpgsql as $$
begin
  if not coalesce(cond, false) then
    raise exception 'NEPAVYKO: %', what;
  end if;
  raise notice 'gerai: %', what;
end $$;

create function pg_temp.fails(stmt text, what text) returns void
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'gerai: % (%)', what, sqlerrm;
    return;
  end;
  raise exception 'NEPAVYKO: turėjo būti klaida: %', what;
end $$;

create function pg_temp.login(p_id uuid, p_anonymous boolean) returns void
language sql as $$
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anonymous)::text,
    false
  );
$$;

create temp table t (k text primary key, v text);
grant all on t to authenticated;

-- ---------------------------------------------------------------- neprisijungęs
set role anon;
select pg_temp.fails('select * from public.profiles', 'neprisijungęs nemato profilių');
select pg_temp.fails('select public.create_pairing_request()', 'neprisijungęs negali kurti QR');
reset role;

-- ---------------------------------------------------------------- senjoro telefonas
select pg_temp.login(:S, true);
set role authenticated;
insert into t select 'qr1', token from public.create_pairing_request();
insert into t select 'qr2', token from public.create_pairing_request();
select pg_temp.check((select count(*) from public.pairing_requests) = 1, 'senas nepanaudotas QR ištrinamas');
select pg_temp.check(length((select v from t where k = 'qr2')) = 64, 'QR kodas ilgas ir atsitiktinis');
select pg_temp.fails(
  format('insert into public.profiles (id, kind, display_name) values (%L, ''helper'', ''X'')', :S),
  'anoniminis telefonas negali tapti pagalbininku');
select pg_temp.fails(
  format('insert into public.profiles (id, kind, display_name) values (%L, ''senior'', ''X'')', :S),
  'senjoras pats savęs nesukuria');
reset role;

-- ---------------------------------------------------------------- pagalbininkė Ona
select pg_temp.login(:A, false);
set role authenticated;
select pg_temp.fails(
  format('select public.claim_pairing(%L, ''Mama'', ''family'')', (select v from t where k = 'qr2')),
  'be vardo susieti negalima');
insert into public.profiles (id, kind, display_name) values (:A, 'helper', 'Ona');
select pg_temp.fails(
  format('select public.claim_pairing(%L, ''Mama'', ''family'')', (select v from t where k = 'qr1')),
  'pasenęs (pakeistas) QR negalioja');
select pg_temp.fails(
  format('select public.claim_pairing(%L, ''  '', ''family'')', (select v from t where k = 'qr2')),
  'senjoro vardas privalomas');
select pg_temp.check(
  public.claim_pairing((select v from t where k = 'qr2'), ' Mama ', 'family') = :S,
  'Ona susieja mamos telefoną');
select pg_temp.fails(
  format('select public.claim_pairing(%L, ''Mama'', ''family'')', (select v from t where k = 'qr2')),
  'tą patį QR antrą kartą panaudoti negalima');
select pg_temp.check(
  (select display_name from public.profiles where id = :S) = 'Mama', 'Ona mato mamos vardą');
select pg_temp.check(
  (select is_admin from public.care_links where senior_id = :S and helper_id = :A), 'Ona yra administratorė');
select pg_temp.check((select count(*) from public.pairing_requests) = 0, 'pagalbininkas nemato QR kodų');
select pg_temp.fails('select public.create_pairing_request()', 'pagalbininkas negali tapti senjoru');
insert into t select 'inv', code from public.create_invite(:S, 'nurse');
select pg_temp.check((select v from t where k = 'inv') ~ '^[A-HJKMNP-Z2-9]{8}$', 'kvietimo kodas aiškus');
select pg_temp.check((select count(*) from public.invites) = 1, 'administratorė mato savo kvietimą');
reset role;

-- ---------------------------------------------------------------- senjoras po susiejimo
select pg_temp.login(:S, true);
set role authenticated;
select pg_temp.check(
  (select display_name from public.profiles where id = :S) = 'Mama', 'senjoras mato savo vardą');
select pg_temp.check(
  (select display_name from public.profiles where id = :A) = 'Ona', 'senjoras mato pagalbininkės vardą');
select pg_temp.check(
  (select claimed_at is not null from public.pairing_requests where senior_user_id = :S), 'senjoras mato, kad QR panaudotas');
select pg_temp.check((select count(*) from public.invites) = 0, 'senjoras nemato kvietimų');
reset role;

-- ---------------------------------------------------------------- svetimas Petras
select pg_temp.login(:C, false);
set role authenticated;
insert into public.profiles (id, kind, display_name) values (:C, 'helper', 'Petras');
select pg_temp.check((select count(*) from public.profiles) = 1, 'svetimas mato tik save');
select pg_temp.check((select count(*) from public.care_links) = 0, 'svetimas nemato ryšių');
select pg_temp.check((select count(*) from public.invites) = 0, 'svetimas nemato kvietimų');
select pg_temp.fails(format('select public.create_invite(%L, ''family'')', :S), 'svetimas negali kviesti');
update public.profiles set display_name = 'Įsilaužėlis' where id = :S;
delete from public.care_links where senior_id = :S;
select pg_temp.fails(
  format('insert into public.profiles (id, kind, display_name) values (%L, ''helper'', ''X'')', :B),
  'negalima sukurti profilio kitam');
select pg_temp.fails(
  format('update public.profiles set kind = ''senior'' where id = %L', :C), 'savo tipo pakeisti negalima');
reset role;

select pg_temp.check((select display_name from public.profiles where id = :S) = 'Mama', 'svetimas nepakeitė vardo');
select pg_temp.check((select count(*) from public.care_links where senior_id = :S) = 1, 'svetimas neištrynė ryšio');

-- ---------------------------------------------------------------- antras pagalbininkas Jonas
select pg_temp.login(:B, false);
set role authenticated;
insert into public.profiles (id, kind, display_name) values (:B, 'helper', 'Jonas');
select pg_temp.fails('select public.accept_invite(''NETINKA1'')', 'neteisingas kodas netinka');
select pg_temp.check(
  public.accept_invite(lower(substr((select v from t where k = 'inv'), 1, 4)) || '-' || substr((select v from t where k = 'inv'), 5)) = :S,
  'Jonas priima kvietimą (mažosios raidės ir brūkšnys netrukdo)');
select pg_temp.fails(
  format('select public.accept_invite(%L)', (select v from t where k = 'inv')), 'kvietimas vienkartinis');
select pg_temp.check(
  (select relation = 'nurse' and not is_admin from public.care_links where helper_id = :B), 'Jonas gavo kvietime nurodytą vaidmenį');
select pg_temp.check(
  (select count(*) from public.profiles where id in (:A, :S)) = 2, 'Jonas mato mamą ir Oną');
select pg_temp.check((select count(*) from public.invites) = 0, 'ne administratorius nemato kvietimų');
select pg_temp.fails(format('select public.create_invite(%L, ''family'')', :S), 'ne administratorius negali kviesti');
update public.care_links set relation = 'social_worker' where helper_id = :B;
select pg_temp.check(
  (select relation from public.care_links where helper_id = :B) = 'social_worker', 'Jonas keičia savo vaidmenį');
select pg_temp.fails(
  format('update public.care_links set is_admin = true where helper_id = %L', :B), 'pats sau administratoriaus teisių neduoda');
delete from public.care_links where helper_id = :A;
reset role;

select pg_temp.check((select count(*) from public.care_links where helper_id = :A) = 1, 'Jonas negali pašalinti Onos');

-- ---------------------------------------------------------------- pasibaigęs QR
select pg_temp.login(:T, true);
set role authenticated;
insert into t select 'qrT', token from public.create_pairing_request();
reset role;
update public.pairing_requests set expires_at = now() - interval '1 minute' where senior_user_id = :T;
select pg_temp.login(:A, false);
set role authenticated;
select pg_temp.fails(
  format('select public.claim_pairing(%L, ''Tėtis'', ''family'')', (select v from t where k = 'qrT')),
  'pasibaigęs QR negalioja');
-- Ona pašalina Joną.
delete from public.care_links where helper_id = :B;
reset role;

select pg_temp.check((select count(*) from public.care_links where helper_id = :B) = 0, 'administratorė pašalina pagalbininką');

\o
\echo 'Visi duomenų bazės testai praėjo.'
