-- Fail closed on mismatched names and incomplete engine coverage; preserve reviewed/hidden reports.
create or replace function carinfo.load_report(gid uuid, r jsonb, generated_by text) returns table (engines int, failures int, checks int, links int)
language plpgsql set search_path = '' as $$
declare
  e jsonb;
  f jsonb;
  generation_status carinfo.status;
  changed_engines int := 0;
  n_engines int := 0;
  n_failures int := 0;
  n_checks int := 0;
  n_links int := 0;
begin
  -- Lock before checking review state; a concurrent review must not be overwritten.
  select g.status into generation_status from carinfo.generations g where g.id = gid for update;
  if not found then raise exception 'no generation %', gid; end if;
  if generation_status = 'reviewed' then
    return query select 0, 0, 0, 0;
    return;
  end if;
  if generation_status = 'hidden' then raise exception 'generation % is hidden', gid; end if;

  if jsonb_typeof(r -> 'engines') is distinct from 'array'
     or jsonb_typeof(r -> 'failures') is distinct from 'array' then
    raise exception 'report engines and failures must be arrays';
  end if;
  if exists (
    select 1 from jsonb_array_elements(r -> 'engines') item
    where not exists (select 1 from carinfo.engines x where x.generation_id = gid and x.name = item ->> 'name')
  ) then raise exception 'unmatched engine assessment in generation %', gid; end if;
  if exists (
    select 1 from jsonb_array_elements(r -> 'engines') item group by item ->> 'name' having count(*) > 1
  ) then raise exception 'duplicate engine assessment in generation %', gid; end if;
  if exists (
    select 1 from carinfo.engines x where x.generation_id = gid and x.status <> 'hidden'
    and not exists (select 1 from jsonb_array_elements(r -> 'engines') item where item ->> 'name' = x.name)
  ) then raise exception 'missing engine assessment in generation %', gid; end if;
  if exists (
    select 1 from jsonb_array_elements(r -> 'failures') item
    where item ->> 'engine' is not null
    and not exists (select 1 from carinfo.engines x where x.generation_id = gid and x.name = item ->> 'engine')
  ) then raise exception 'unmatched failure engine in generation %', gid; end if;

  update carinfo.generations set
    summary_sl = r #>> '{summary,sl}', summary_en = r #>> '{summary,en}', pros = r -> 'pros', cons = r -> 'cons',
    ncap_stars = (r #>> '{ncap,stars}')::smallint, ncap_year = (r #>> '{ncap,year}')::smallint, ncap_url = r #>> '{ncap,url}',
    ai_confidence = (r ->> 'confidence')::real, status = 'ai_checked', generated_by = load_report.generated_by
  where id = gid and status <> 'reviewed';
  if not found and not exists (select 1 from carinfo.generations where id = gid) then
    raise exception 'no generation %', gid;
  end if;

  for e in select * from jsonb_array_elements(r -> 'engines') loop
    update carinfo.engines x set
      verdict = (e ->> 'verdict')::carinfo.verdict, score = (e ->> 'score')::smallint,
      annual_cost_min = (e ->> 'annual_cost_min')::int, annual_cost_max = (e ->> 'annual_cost_max')::int,
      summary_sl = e #>> '{summary,sl}', summary_en = e #>> '{summary,en}', status = 'ai_checked', generated_by = load_report.generated_by
    where x.generation_id = gid and x.name = e ->> 'name' and x.status not in ('reviewed', 'hidden');
    get diagnostics changed_engines = row_count;
    n_engines := n_engines + changed_engines;
  end loop;

  delete from carinfo.failures where generation_id = gid and status <> 'reviewed';
  for f in select * from jsonb_array_elements(r -> 'failures') loop
    insert into carinfo.failures (generation_id, engine_id, area, title_sl, title_en, body_sl, body_en, symptoms_sl, symptoms_en,
      year_from, year_to, likelihood, cost_min, cost_max, sources, ai_check, ai_note, status, generated_by)
    values (gid,
      (select x.id from carinfo.engines x where x.generation_id = gid and x.name = f ->> 'engine' order by x.kw nulls last, x.id limit 1),
      (f ->> 'area')::carinfo.area, f #>> '{title,sl}', f #>> '{title,en}', f #>> '{body,sl}', f #>> '{body,en}',
      f #>> '{symptoms,sl}', f #>> '{symptoms,en}', (f ->> 'year_from')::smallint, (f ->> 'year_to')::smallint,
      (f ->> 'likelihood')::carinfo.likelihood, (f ->> 'cost_min')::int, (f ->> 'cost_max')::int, f -> 'sources',
      (f ->> 'check')::carinfo.ai_check, f ->> 'note', 'ai_checked', load_report.generated_by);
    n_failures := n_failures + 1;
  end loop;

  delete from carinfo.checks where generation_id = gid and status <> 'reviewed';
  insert into carinfo.checks (generation_id, text_sl, text_en, sort, status)
  select gid, c.value ->> 'sl', c.value ->> 'en', (c.ordinality - 1)::smallint, 'ai_checked'
  from jsonb_array_elements(r -> 'checks') with ordinality c;
  get diagnostics n_checks = row_count;

  delete from carinfo.links where generation_id = gid;
  insert into carinfo.links (generation_id, kind, label, url)
  select gid, l ->> 'kind', l ->> 'title', l ->> 'url' from jsonb_array_elements(r -> 'links') l
  on conflict do nothing;
  get diagnostics n_links = row_count;

  return query select n_engines, n_failures, n_checks, n_links;
end;
$$;

revoke execute on function carinfo.load_report(uuid, jsonb, text) from public, anon, authenticated;
