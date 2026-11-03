-- Chanchito: base de datos en Supabase.
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run". Se puede correr más de una vez.

-- Cada dato de la app es un "documento" JSON guardado con una ruta, por ejemplo:
--   data/users/<uid>/settings                     configuración del usuario
--   data/users/<uid>/root/cuentas/<cuenta>        cuentas personales
--   data/users/<uid>/root/cuentas/<cuenta>/movs/<id>
--   compartidas/<cuenta>                           cuentas compartidas (con lista de miembros)
--   compartidas/<cuenta>/movs/<id>

create table if not exists public.docs (
  path       text primary key,
  parent     text not null,
  data       jsonb not null default '{}'::jsonb,
  members    uuid[],
  updated_at timestamptz not null default now()
);
create index if not exists docs_parent_idx on public.docs (parent);
create index if not exists docs_members_idx on public.docs using gin (members);

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  updated_at timestamptz not null default now()
);

-- parent y members se calculan solos a partir de la ruta y del JSON.
create or replace function public.docs_fill() returns trigger
language plpgsql set search_path = public as $$
begin
  new.parent := regexp_replace(new.path, '/[^/]+$', '');
  if new.path ~ '^compartidas/[^/]+$' then
    new.members := coalesce(
      (select array_agg(x::uuid) from jsonb_array_elements_text(coalesce(new.data->'members','[]'::jsonb)) x
        where x ~* '^[0-9a-f-]{36}$'), '{}');
  else
    new.members := null;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists docs_fill on public.docs;
create trigger docs_fill before insert or update on public.docs
  for each row execute function public.docs_fill();

-- ¿Puede el usuario actual ver/editar esta ruta?
create or replace function public.can_access(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p like 'data/users/' || auth.uid()::text || '/%'
    or (p like 'compartidas/%' and exists (
          select 1 from public.docs d
          where d.path = 'compartidas/' || split_part(p, '/', 2)
            and auth.uid() = any (d.members)))
  )
$$;

alter table public.docs enable row level security;
alter table public.profiles enable row level security;

drop policy if exists docs_select on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_select on public.docs for select to authenticated using (public.can_access(path));
-- Crear: en tu espacio, dentro de una compartida donde ya sos miembro, o una compartida nueva donde te incluís.
create policy docs_insert on public.docs for insert to authenticated with check (
  public.can_access(path)
  or (path ~ '^compartidas/[^/]+$' and auth.uid() = any (members)));
-- Editar una compartida: tenés que seguir siendo miembro después del cambio.
create policy docs_update on public.docs for update to authenticated
  using (public.can_access(path))
  with check (public.can_access(path) and (path !~ '^compartidas/[^/]+$' or auth.uid() = any (members)));
create policy docs_delete on public.docs for delete to authenticated using (public.can_access(path));

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_upsert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_upsert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

-- Unirse a una cuenta compartida con su código de 6 letras.
create or replace function public.join_shared(code text)
returns json language plpgsql security definer set search_path = public as $$
declare d public.docs; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into d from public.docs
    where path ~ '^compartidas/[^/]+$' and upper(data->>'code') = upper(trim(code)) limit 1;
  if not found then return json_build_object('found', false); end if;
  if uid = any (d.members) then
    return json_build_object('found', true, 'already', true, 'id', split_part(d.path,'/',2), 'name', d.data->>'name');
  end if;
  update public.docs
     set data = jsonb_set(data, '{members}', coalesce(data->'members','[]'::jsonb) || to_jsonb(uid::text))
   where path = d.path;
  return json_build_object('found', true, 'already', false, 'id', split_part(d.path,'/',2), 'name', d.data->>'name');
end $$;
revoke all on function public.join_shared(text) from public, anon;
grant execute on function public.join_shared(text) to authenticated;

-- Cambios en vivo (para que las cuentas compartidas se actualicen solas en todos los dispositivos).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

grant select, insert, update, delete on public.docs to authenticated;
grant select, insert, update on public.profiles to authenticated;
