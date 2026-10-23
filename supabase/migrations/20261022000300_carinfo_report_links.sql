-- Written reports (scripts/carinfo/report.ts → verify.ts → import.ts) add exact outside links by kind and the
-- generation's Euro NCAP rating. Reports are imported only after the check pass, so links need no status.
alter table carinfo.links
  add column kind text not null default 'other' check (kind in ('test', 'safety', 'reliability', 'review', 'forum', 'other')),
  add constraint links_url_https check (url like 'https://%'),
  add constraint links_generation_url_key unique (generation_id, url);

alter table carinfo.generations
  add column ncap_stars smallint check (ncap_stars between 0 and 5),
  add column ncap_year smallint,
  add column ncap_url text check (ncap_url like 'https://%');
