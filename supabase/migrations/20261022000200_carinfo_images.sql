-- Generation photos live in Cloudflare R2 (never in the repo or in Supabase); rows only point at them.
-- Wikimedia Commons licences require the author and licence next to the photo, so they are stored with it.
alter table carinfo.generations
  add column image_url text check (image_url like 'https://%'),
  add column image_credit text,
  add column image_license text,
  add column image_source_url text check (image_source_url like 'https://%');
