-- Car info ("avto poročila"): generations, engines, failures, recalls, checklists.
-- Makes/models mirror src/data/makes.ts (synced by scripts/carinfo/sync-models.ts).

create schema if not exists carinfo;

create type carinfo.status as enum ('skeleton', 'generated', 'ai_checked', 'reviewed', 'hidden');
create type carinfo.fuel as enum ('petrol', 'diesel', 'hybrid', 'plugin_hybrid', 'electric', 'lpg', 'cng');
create type carinfo.verdict as enum ('recommended', 'ok', 'avoid');
create type carinfo.likelihood as enum ('low', 'med', 'high');
create type carinfo.area as enum ('engine', 'gearbox', 'electrics', 'suspension', 'body', 'emissions');
create type carinfo.ai_check as enum ('supported', 'weak', 'unsupported');

-- Admins (for the review site). Must exist before is_admin().
create table carinfo.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function carinfo.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from carinfo.admins where user_id = (select auth.uid()));
$$;

create function carinfo.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Taxonomy mirror -----------------------------------------------------------

create table carinfo.makes (
  id text primary key,
  name text not null
);

create table carinfo.models (
  id text primary key,
  make_id text not null references carinfo.makes (id) on delete cascade,
  name text not null
);
create index on carinfo.models (make_id);

-- Content -------------------------------------------------------------------

create table carinfo.generations (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references carinfo.models (id) on delete cascade,
  slug text not null,
  name text not null,
  code text,
  year_from smallint not null,
  year_to smallint,
  summary_sl text,
  summary_en text,
  pros jsonb not null default '[]',  -- [{sl, en}]
  cons jsonb not null default '[]',
  registrations integer not null default 0,
  ai_confidence real,
  status carinfo.status not null default 'skeleton',
  generated_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, slug),
  check (year_to is null or year_to >= year_from)
);

create table carinfo.engines (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references carinfo.generations (id) on delete cascade,
  slug text not null,
  name text not null,
  engine_code text,
  fuel carinfo.fuel not null,
  kw smallint,
  ccm smallint,
  year_from smallint,
  year_to smallint,
  co2 smallint,
  verdict carinfo.verdict,
  score smallint check (score between 1 and 10),
  annual_cost_min integer,
  annual_cost_max integer,
  summary_sl text,
  summary_en text,
  registrations integer not null default 0,
  ai_confidence real,
  status carinfo.status not null default 'skeleton',
  generated_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generation_id, slug),
  check (annual_cost_max is null or annual_cost_max >= annual_cost_min)
);

create table carinfo.failures (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references carinfo.generations (id) on delete cascade,
  engine_id uuid references carinfo.engines (id) on delete cascade, -- null = whole generation
  area carinfo.area not null,
  title_sl text not null,
  title_en text not null,
  body_sl text,
  body_en text,
  symptoms_sl text,
  symptoms_en text,
  year_from smallint,
  year_to smallint,
  likelihood carinfo.likelihood not null,
  cost_min integer,
  cost_max integer,
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) >= 1), -- [{url, title}]
  ai_check carinfo.ai_check,
  ai_note text,
  status carinfo.status not null default 'generated',
  generated_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table carinfo.recalls (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references carinfo.generations (id) on delete cascade,
  engine_id uuid references carinfo.engines (id) on delete cascade,
  authority text not null, -- KBA / NHTSA / EU Safety Gate / maker
  ref text,                -- the authority's own recall id
  title_sl text,
  title_en text not null,
  year_from smallint,
  year_to smallint,
  source_url text not null,
  status carinfo.status not null default 'reviewed',
  created_at timestamptz not null default now(),
  unique nulls not distinct (generation_id, authority, ref)
);

create table carinfo.checks (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references carinfo.generations (id) on delete cascade,
  engine_id uuid references carinfo.engines (id) on delete cascade,
  text_sl text not null,
  text_en text not null,
  sort smallint not null default 0,
  status carinfo.status not null default 'generated'
);

create table carinfo.links (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references carinfo.generations (id) on delete cascade,
  label text not null,
  url text not null
);

-- Public "report an error" inbox.
create table carinfo.reports (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid references carinfo.generations (id) on delete set null,
  engine_id uuid references carinfo.engines (id) on delete set null,
  page_url text check (char_length(page_url) <= 500),
  message text not null check (char_length(message) between 1 and 2000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- FK indexes
create index on carinfo.generations (model_id);
create index on carinfo.engines (generation_id);
create index on carinfo.failures (generation_id);
create index on carinfo.failures (engine_id);
create index on carinfo.recalls (engine_id);
create index on carinfo.checks (generation_id);
create index on carinfo.checks (engine_id);
create index on carinfo.links (generation_id);
create index on carinfo.reports (generation_id);
create index on carinfo.reports (engine_id);

create trigger touch before update on carinfo.generations for each row execute function carinfo.touch_updated_at();
create trigger touch before update on carinfo.engines for each row execute function carinfo.touch_updated_at();
create trigger touch before update on carinfo.failures for each row execute function carinfo.touch_updated_at();

-- Access --------------------------------------------------------------------

grant usage on schema carinfo to anon, authenticated, service_role;
grant select on all tables in schema carinfo to anon, authenticated;
grant insert, update, delete on all tables in schema carinfo to authenticated; -- gated by RLS (admins)
grant insert on carinfo.reports to anon;
grant all on all tables in schema carinfo to service_role;
grant execute on function carinfo.is_admin() to anon, authenticated;

alter table carinfo.admins enable row level security;
alter table carinfo.makes enable row level security;
alter table carinfo.models enable row level security;
alter table carinfo.generations enable row level security;
alter table carinfo.engines enable row level security;
alter table carinfo.failures enable row level security;
alter table carinfo.recalls enable row level security;
alter table carinfo.checks enable row level security;
alter table carinfo.links enable row level security;
alter table carinfo.reports enable row level security;

-- Public reads: visible statuses; admins see everything.
create policy read on carinfo.makes for select to anon, authenticated using (true);
create policy read on carinfo.models for select to anon, authenticated using (true);
create policy read on carinfo.links for select to anon, authenticated using (true);
create policy read on carinfo.generations for select to anon, authenticated
  using (status in ('skeleton', 'ai_checked', 'reviewed') or (select carinfo.is_admin()));
create policy read on carinfo.engines for select to anon, authenticated
  using (status in ('skeleton', 'ai_checked', 'reviewed') or (select carinfo.is_admin()));
create policy read on carinfo.failures for select to anon, authenticated
  using ((status in ('ai_checked', 'reviewed') and ai_check is distinct from 'unsupported') or (select carinfo.is_admin()));
create policy read on carinfo.recalls for select to anon, authenticated
  using (status <> 'hidden' or (select carinfo.is_admin()));
create policy read on carinfo.checks for select to anon, authenticated
  using (status in ('ai_checked', 'reviewed') or (select carinfo.is_admin()));
create policy read on carinfo.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- Admin writes on content tables.
create policy admin_insert on carinfo.generations for insert to authenticated with check ((select carinfo.is_admin()));
create policy admin_update on carinfo.generations for update to authenticated using ((select carinfo.is_admin()));
create policy admin_delete on carinfo.generations for delete to authenticated using ((select carinfo.is_admin()));
create policy admin_insert on carinfo.engines for insert to authenticated with check ((select carinfo.is_admin()));
create policy admin_update on carinfo.engines for update to authenticated using ((select carinfo.is_admin()));
create policy admin_delete on carinfo.engines for delete to authenticated using ((select carinfo.is_admin()));
create policy admin_insert on carinfo.failures for insert to authenticated with check ((select carinfo.is_admin()));
create policy admin_update on carinfo.failures for update to authenticated using ((select carinfo.is_admin()));
create policy admin_delete on carinfo.failures for delete to authenticated using ((select carinfo.is_admin()));
create policy admin_insert on carinfo.recalls for insert to authenticated with check ((select carinfo.is_admin()));
create policy admin_update on carinfo.recalls for update to authenticated using ((select carinfo.is_admin()));
create policy admin_delete on carinfo.recalls for delete to authenticated using ((select carinfo.is_admin()));
create policy admin_insert on carinfo.checks for insert to authenticated with check ((select carinfo.is_admin()));
create policy admin_update on carinfo.checks for update to authenticated using ((select carinfo.is_admin()));
create policy admin_delete on carinfo.checks for delete to authenticated using ((select carinfo.is_admin()));
create policy admin_insert on carinfo.links for insert to authenticated with check ((select carinfo.is_admin()));
create policy admin_update on carinfo.links for update to authenticated using ((select carinfo.is_admin()));
create policy admin_delete on carinfo.links for delete to authenticated using ((select carinfo.is_admin()));

-- Feedback: anyone may submit; only admins read/resolve.
create policy submit on carinfo.reports for insert to anon, authenticated with check (resolved = false);
create policy admin_read on carinfo.reports for select to authenticated using ((select carinfo.is_admin()));
create policy admin_update on carinfo.reports for update to authenticated using ((select carinfo.is_admin()));
