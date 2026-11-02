-- Integration fixture for an isolated PostgreSQL database with the carinfo migrations applied.
-- Everything is rolled back. Run through the local validation harness, never against production.
begin;
do $test$
declare
  gid uuid := gen_random_uuid();
  model_key text := 'import-regression-' || gid::text;
  report jsonb := '{"summary":{"sl":"Original","en":"Original"},"pros":[],"cons":[],"confidence":0.8,"ncap":null,"engines":[{"name":"1.0","verdict":"recommended","score":8,"summary":{"sl":"Good","en":"Good"}}],"failures":[],"checks":[],"links":[{"kind":"test","title":"Test","url":"https://example.com/test"}]}'::jsonb;
  changed int;
  current_summary text;
begin
  insert into carinfo.makes(id,name) values(model_key,'Regression');
  insert into carinfo.models(id,make_id,name) values(model_key,model_key,'Regression');
  insert into carinfo.generations(id,model_id,slug,name,year_from) values(gid,model_key,'test','Test',2020);
  insert into carinfo.engines(generation_id,slug,name,fuel,kw) values(gid,'first','1.0','petrol',60),(gid,'second','1.0','petrol',70);
  select r.engines into changed from carinfo.load_report(gid,report,'regression') r;
  if changed <> 2 then raise exception 'expected 2 actual updated engine rows, got %',changed; end if;
  begin
    perform carinfo.load_report(gid,jsonb_set(report,'{engines,0,name}','"1.0 (X)"'::jsonb),'regression');
    raise exception 'unmatched assessment accepted';
  exception when others then
    if sqlerrm not like 'unmatched engine assessment%' then raise; end if;
  end;
  begin
    perform carinfo.load_report(gid,jsonb_set(report,'{engines}','[]'::jsonb),'regression');
    raise exception 'missing assessment accepted';
  exception when others then
    if sqlerrm not like 'missing engine assessment%' then raise; end if;
  end;
  begin
    perform carinfo.load_report(gid,jsonb_set(report,'{engines}',(report->'engines')||(report->'engines')),'regression');
    raise exception 'duplicate assessment accepted';
  exception when others then
    if sqlerrm not like 'duplicate engine assessment%' then raise; end if;
  end;
  begin
    perform carinfo.load_report(gid,jsonb_set(report,'{failures}','[{"engine":"unknown"}]'::jsonb),'regression');
    raise exception 'unmatched failure engine accepted';
  exception when others then
    if sqlerrm not like 'unmatched failure engine%' then raise; end if;
  end;
  update carinfo.generations set status='reviewed' where id=gid;
  select r.engines into changed from carinfo.load_report(gid,jsonb_set(report,'{summary,en}','"Changed"'::jsonb),'regression') r;
  select summary_en into current_summary from carinfo.generations where id=gid;
  if changed<>0 or current_summary<>'Original' or (select count(*) from carinfo.links where generation_id=gid)<>1 then
    raise exception 'reviewed report was modified';
  end if;
  update carinfo.generations set status='hidden' where id=gid;
  begin
    perform carinfo.load_report(gid,report,'regression');
    raise exception 'hidden generation republished';
  exception when others then
    if sqlerrm not like 'generation % is hidden' then raise; end if;
  end;
end;
$test$;
rollback;