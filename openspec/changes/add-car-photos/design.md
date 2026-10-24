# Design

## Context

- `scripts/carinfo/images.ts` has these subcommands:
  - `fetch`: Wikipedia/Commons, free licences only, cached in `data-raw/carinfo/images`;
  - `recheck`: the detail, year and duplicate rules;
  - `upload`: to R2 through wrangler;
  - `sql`: writes the `image_*` columns using `IMG_BASE`.
- The `carinfo_images` migration is applied. `CarPhoto` and `ModelHero` already render `image_url`.

## Goals / Non-Goals

**Goals:**
- Photos live on all generations that have a suitable free image.

**Non-Goals:**
- Image resizing pipelines beyond what R2 or Cloudflare serve.
- User uploads.

## Decisions

- **Bucket:** `cargregator`, public through the custom domain `img.jelnikar.dev`, not the r2.dev URL (that one
  is rate limited and not for production).
- **Keys:** `<model_id>/<gen_slug>.<ext>`, immutable. A replaced photo gets a new key, so long cache headers stay
  safe.
- **Order:** `recheck` → `upload` → `sql` → Matija loads the SQL → spot-check.
- **Credit:** one small line under the photo, "Foto: <author>, <licence>", linked to `image_source_url`. This is
  question 6 in CARINFO-QUESTIONS.

## Risks / Trade-offs

- **Commons metadata** is sometimes wrong about the generation. Recheck rules and a spot-check reduce that, and the
  admin can clear a photo later (a future admin field).
- **Custom domain DNS** must be on Cloudflare. If jelnikar.dev is not, use another zone that is.
