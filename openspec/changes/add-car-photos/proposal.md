# Proposal

## Why

The model pages have a photo slot, a hero image with a generation switcher, but no photos are live. Photos are
fetched and cached locally from Wikipedia/Commons under free licences. They still need hosting on Cloudflare R2 and
their URLs written to Supabase.

## What Changes

- Create the R2 bucket `cargregator` with a custom domain (suggested `img.jelnikar.dev`).
- Upload the cached photos with `images.ts upload`, then write the `image_*` columns with `images.ts sql`
  (`IMG_BASE=…`).
- Run `images.ts recheck` first, to drop wrong-generation, duplicate or low-detail photos.
- Show the licence credit under each photo (CC BY-SA requires attribution).

Out of scope: photos for engines, user-uploaded photos, and storing photos in the repo or in Supabase.

## Capabilities

### New Capabilities
- `car-photos`: showing a freely licensed photo of each generation, with its required credit.

### Modified Capabilities

## Impact

- Cloudflare: an R2 bucket and DNS for the custom domain. Matija has to do this, plus `wrangler login`.
- Supabase: the `generations.image_url`, `image_credit`, `image_license` and `image_source_url` columns (the
  migration is already applied). This is a data write that needs Matija's OK.
- `scripts/carinfo/images.ts`; `CarPhoto` and `ModelHero` render the credit.
