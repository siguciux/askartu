-- 2 etapas: paskyros ir susiejimas.
--
-- Kas yra kas:
--   * Pagalbininkas prisijungia el. paštu su vienkartiniu kodu.
--   * Senjoras slaptažodžio neturi: jo telefonas prisijungia anonimiškai
--     (Supabase „anonymous sign-in“) ir rodo QR kodą. Pagalbininkas jį
--     nuskenuoja, ir tada senjoras gauna profilį bei ryšį su pagalbininku.
--   * Pagalbininkas, kuris susiejo senjorą, yra jo „administratorius“: gali
--     kviesti kitus pagalbininkus ir juos pašalinti.
--
-- Saugumas: visos lentelės turi RLS. Kiekvienas mato tik save, savo senjorus
-- ir kitus tų pačių senjorų pagalbininkus. Susiejimas ir kvietimai vyksta tik
-- per žemiau esančias funkcijas, kurios patikrina visas sąlygas.

-- ---------------------------------------------------------------------------
-- Tipai
-- ---------------------------------------------------------------------------

create type public.person_kind as enum ('senior', 'helper');

-- Kas pagalbininkas senjorui: šeimos narys, slaugytoja ar socialinė darbuotoja.
create type public.care_relation as enum ('family', 'nurse', 'social_worker');

-- ---------------------------------------------------------------------------
-- Lentelės
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  kind public.person_kind not null,
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 60),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Senjorai ir pagalbininkai. Senjoro vardą įrašo jį susiejęs pagalbininkas.';

create table public.care_links (
  senior_id uuid not null references public.profiles (id) on delete cascade,
  helper_id uuid not null references public.profiles (id) on delete cascade,
  relation public.care_relation not null,
  -- Gali kviesti ir šalinti kitus šio senjoro pagalbininkus.
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (senior_id, helper_id),
  check (senior_id <> helper_id)
);

create index care_links_helper_idx on public.care_links (helper_id);

comment on table public.care_links is 'Kuris pagalbininkas rūpinasi kuriuo senjoru.';

-- Senjoro telefono QR kodas susiejimui. Galioja 15 minučių.
create table public.pairing_requests (
  token text primary key,
  senior_user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '15 minutes',
  claimed_by uuid references public.profiles (id) on delete set null,
  claimed_at timestamptz
);

create index pairing_requests_user_idx on public.pairing_requests (senior_user_id);

-- Kvietimas kitam pagalbininkui. Galioja 7 dienas, panaudojamas vieną kartą.
create table public.invites (
  code text primary key,
  senior_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  relation public.care_relation not null,
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index invites_senior_idx on public.invites (senior_id);

-- ---------------------------------------------------------------------------
-- Pagalbinės funkcijos RLS taisyklėms (security definer, kad išvengtume
-- RLS rekursijos tarp profiles ir care_links)
-- ---------------------------------------------------------------------------

create function public.is_helper_of(p_senior uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.care_links
    where senior_id = p_senior and helper_id = auth.uid()
  );
$$;

create function public.is_admin_of(p_senior uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.care_links
    where senior_id = p_senior and helper_id = auth.uid() and is_admin
  );
$$;

-- Ar prisijungęs žmogus ir nurodytas žmogus yra tame pačiame rūpinimosi rate
-- (senjoras su savo pagalbininku arba du to paties senjoro pagalbininkai).
create function public.shares_circle_with(p_person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.care_links mine
    join public.care_links theirs on theirs.senior_id = mine.senior_id
    where mine.helper_id = auth.uid() and theirs.helper_id = p_person
  )
  or exists (
    select 1 from public.care_links
    where (senior_id = auth.uid() and helper_id = p_person)
       or (helper_id = auth.uid() and senior_id = p_person)
  );
$$;

-- Ar prisijungta tikra (ne anonimine) paskyra.
create function public.is_registered_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.care_links enable row level security;
alter table public.pairing_requests enable row level security;
alter table public.invites enable row level security;

-- Neprisijungę nieko nemato.
revoke all on public.profiles, public.care_links, public.pairing_requests, public.invites from anon;
revoke all on public.profiles, public.care_links, public.pairing_requests, public.invites from authenticated;

grant select, insert on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, delete on public.care_links to authenticated;
grant update (relation) on public.care_links to authenticated;
grant select on public.pairing_requests to authenticated;
grant select on public.invites to authenticated;

-- profiles
create policy "matau save ir savo ratą"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_circle_with(id));

create policy "pagalbininkas susikuria savo profilį"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and kind = 'helper' and public.is_registered_user());

create policy "keičiu savo vardą"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "senjoro administratorius keičia senjoro vardą"
  on public.profiles for update to authenticated
  using (kind = 'senior' and public.is_admin_of(id))
  with check (kind = 'senior' and public.is_admin_of(id));

-- care_links
create policy "matau savo rato ryšius"
  on public.care_links for select to authenticated
  using (helper_id = auth.uid() or senior_id = auth.uid() or public.is_helper_of(senior_id));

create policy "išeinu pats arba šalina administratorius"
  on public.care_links for delete to authenticated
  using (helper_id = auth.uid() or public.is_admin_of(senior_id));

create policy "keičiu savo vaidmenį"
  on public.care_links for update to authenticated
  using (helper_id = auth.uid())
  with check (helper_id = auth.uid());

-- pairing_requests: senjoro telefonas mato tik savo kodus.
create policy "senjoras mato savo QR kodus"
  on public.pairing_requests for select to authenticated
  using (senior_user_id = auth.uid());

-- invites: mato tik senjoro administratoriai.
create policy "administratorius mato kvietimus"
  on public.invites for select to authenticated
  using (public.is_admin_of(senior_id));

-- ---------------------------------------------------------------------------
-- Veiksmai (RPC)
-- ---------------------------------------------------------------------------

-- Senjoro telefonas: sukuria naują QR kodą. Seni nepanaudoti kodai ištrinami.
create function public.create_pairing_request()
returns table (token text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'Reikia prisijungti' using errcode = '28000';
  end if;

  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.kind = 'helper') then
    raise exception 'Pagalbininko paskyra negali būti senjoras' using errcode = '22023';
  end if;

  delete from public.pairing_requests pr
  where pr.senior_user_id = auth.uid() and pr.claimed_at is null;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  return query
  insert into public.pairing_requests as pr (token, senior_user_id)
  values (v_token, auth.uid())
  returning pr.token, pr.expires_at;
end;
$$;

-- Pagalbininkas: nuskenavo senjoro QR kodą.
-- Sukuria senjoro profilį (jei dar nėra) ir ryšį. Grąžina senjoro id.
create function public.claim_pairing(
  p_token text,
  p_senior_name text,
  p_relation public.care_relation
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_request public.pairing_requests%rowtype;
  v_has_links boolean;
begin
  if not public.is_registered_user() then
    raise exception 'Reikia prisijungti el. paštu' using errcode = '28000';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and kind = 'helper') then
    raise exception 'Pirma įrašykite savo vardą' using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_senior_name, ''))) not between 1 and 60 then
    raise exception 'Įrašykite senjoro vardą' using errcode = '22023';
  end if;

  select * into v_request
  from public.pairing_requests
  where token = p_token
  for update;

  if not found or v_request.claimed_at is not null or v_request.expires_at < now() then
    raise exception 'QR kodas negalioja. Senjoro telefone atnaujinkite kodą.' using errcode = 'P0002';
  end if;

  if v_request.senior_user_id = auth.uid() then
    raise exception 'Negalima susieti su savimi' using errcode = '22023';
  end if;

  insert into public.profiles (id, kind, display_name)
  values (v_request.senior_user_id, 'senior', btrim(p_senior_name))
  on conflict (id) do nothing;

  if not exists (select 1 from public.profiles where id = v_request.senior_user_id and kind = 'senior') then
    raise exception 'Šis telefonas naudojamas kaip pagalbininko' using errcode = '22023';
  end if;

  select exists (select 1 from public.care_links where senior_id = v_request.senior_user_id)
  into v_has_links;

  insert into public.care_links (senior_id, helper_id, relation, is_admin)
  values (v_request.senior_user_id, auth.uid(), p_relation, true)
  on conflict (senior_id, helper_id) do update set relation = excluded.relation, is_admin = true;

  -- Jei senjoras jau turėjo pagalbininkų (pvz. naujas telefonas), vardo nekeičiame.
  if not v_has_links then
    update public.profiles set display_name = btrim(p_senior_name)
    where id = v_request.senior_user_id;
  end if;

  update public.pairing_requests
  set claimed_by = auth.uid(), claimed_at = now()
  where token = p_token;

  return v_request.senior_user_id;
end;
$$;

-- Administratorius: sukuria kvietimą kitam pagalbininkui. Grąžina kodą.
create function public.create_invite(p_senior uuid, p_relation public.care_relation)
returns table (code text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  -- Be lengvai supainiojamų raidžių ir skaičių (0/O, 1/I/L).
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_bytes bytea;
  i int;
begin
  if not public.is_admin_of(p_senior) then
    raise exception 'Kviesti gali tik senjorą susiejęs pagalbininkas' using errcode = '42501';
  end if;

  loop
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    for i in 0..7 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % length(v_alphabet)) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.invites where invites.code = v_code);
  end loop;

  return query
  insert into public.invites as inv (code, senior_id, created_by, relation)
  values (v_code, p_senior, auth.uid(), p_relation)
  returning inv.code, inv.expires_at;
end;
$$;

-- Pagalbininkas: priima kvietimą. Grąžina senjoro id.
create function public.accept_invite(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invite public.invites%rowtype;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if not public.is_registered_user() then
    raise exception 'Reikia prisijungti el. paštu' using errcode = '28000';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and kind = 'helper') then
    raise exception 'Pirma įrašykite savo vardą' using errcode = '22023';
  end if;

  select * into v_invite from public.invites where code = v_code for update;

  if not found or v_invite.used_at is not null or v_invite.expires_at < now() then
    raise exception 'Kvietimo kodas negalioja' using errcode = 'P0002';
  end if;

  insert into public.care_links (senior_id, helper_id, relation, is_admin)
  values (v_invite.senior_id, auth.uid(), v_invite.relation, false)
  on conflict (senior_id, helper_id) do nothing;

  update public.invites set used_by = auth.uid(), used_at = now() where code = v_code;

  return v_invite.senior_id;
end;
$$;

revoke all on function public.create_pairing_request() from public, anon;
revoke all on function public.claim_pairing(text, text, public.care_relation) from public, anon;
revoke all on function public.create_invite(uuid, public.care_relation) from public, anon;
revoke all on function public.accept_invite(text) from public, anon;
revoke all on function public.is_helper_of(uuid) from public, anon;
revoke all on function public.is_admin_of(uuid) from public, anon;
revoke all on function public.shares_circle_with(uuid) from public, anon;
revoke all on function public.is_registered_user() from public, anon;

grant execute on function public.create_pairing_request() to authenticated;
grant execute on function public.claim_pairing(text, text, public.care_relation) to authenticated;
grant execute on function public.create_invite(uuid, public.care_relation) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.is_helper_of(uuid) to authenticated;
grant execute on function public.is_admin_of(uuid) to authenticated;
grant execute on function public.shares_circle_with(uuid) to authenticated;
grant execute on function public.is_registered_user() to authenticated;
