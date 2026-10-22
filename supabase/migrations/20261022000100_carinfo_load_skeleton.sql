-- Bulk loader for scripts/carinfo/skeleton.ts. Takes compact rows so the SQL sent through the MCP stays small:
--   [{model_id, generations: [[slug, name, code, year_from, year_to, registrations]],
--     engines: [[generation_slug, slug, name, engine_code, fuel, kw, ccm, year_from, year_to, registrations]]}]
-- Updates only skeleton facts, never editorial fields or status. Skeleton rows the payload no longer has are
-- removed; rows that have editorial content are kept.

create function carinfo.load_skeleton(payload jsonb) returns table (models int, generations int, engines int)
language plpgsql set search_path = '' as $$
declare
  m jsonb;
  g jsonb;
  e jsonb;
  gid uuid;
  n_models int := 0;
  n_gens int := 0;
  n_engines int := 0;
begin
  for m in select * from jsonb_array_elements(payload) loop
    n_models := n_models + 1;

    for g in select * from jsonb_array_elements(m -> 'generations') loop
      insert into carinfo.generations (model_id, slug, name, code, year_from, year_to, registrations)
      values (m ->> 'model_id', g ->> 0, g ->> 1, g ->> 2, (g ->> 3)::smallint, (g ->> 4)::smallint, (g ->> 5)::int)
      on conflict (model_id, slug) do update set
        name = excluded.name, code = excluded.code, year_from = excluded.year_from,
        year_to = excluded.year_to, registrations = excluded.registrations;
      n_gens := n_gens + 1;
    end loop;

    for e in select * from jsonb_array_elements(m -> 'engines') loop
      select id into strict gid from carinfo.generations where model_id = m ->> 'model_id' and slug = e ->> 0;
      insert into carinfo.engines (generation_id, slug, name, engine_code, fuel, kw, ccm, year_from, year_to, registrations)
      values (gid, e ->> 1, e ->> 2, e ->> 3, (e ->> 4)::carinfo.fuel, (e ->> 5)::smallint, (e ->> 6)::smallint,
              (e ->> 7)::smallint, (e ->> 8)::smallint, (e ->> 9)::int)
      on conflict (generation_id, slug) do update set
        name = excluded.name, engine_code = coalesce(carinfo.engines.engine_code, excluded.engine_code),
        fuel = excluded.fuel, kw = excluded.kw, ccm = excluded.ccm, year_from = excluded.year_from,
        year_to = excluded.year_to, registrations = excluded.registrations;
      n_engines := n_engines + 1;
    end loop;

    delete from carinfo.engines x using carinfo.generations y
    where x.generation_id = y.id and y.model_id = m ->> 'model_id' and x.status = 'skeleton'
      and not exists (select 1 from jsonb_array_elements(m -> 'engines') e2 where e2 ->> 0 = y.slug and e2 ->> 1 = x.slug);
    delete from carinfo.generations y
    where y.model_id = m ->> 'model_id' and y.status = 'skeleton'
      and not exists (select 1 from jsonb_array_elements(m -> 'generations') g2 where g2 ->> 0 = y.slug)
      and not exists (select 1 from carinfo.engines x where x.generation_id = y.id and x.status <> 'skeleton');
  end loop;
  return query select n_models, n_gens, n_engines;
end;
$$;

revoke execute on function carinfo.load_skeleton(jsonb) from public, anon, authenticated;
