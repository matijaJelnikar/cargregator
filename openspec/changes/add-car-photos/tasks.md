# Tasks

## 1. Hosting

- [x] 1.1 (Matija) Create the R2 bucket `cargregator` and connect the custom domain (suggested `cars-img.jelnikar.dev`)
- [x] 1.2 (Matija) `! npx wrangler login`

## 2. Photos

- [x] 2.1 `node scripts/carinfo/images.ts recheck` and review what it drops
- [x] 2.2 `node scripts/carinfo/images.ts upload`
- [x] 2.3 `IMG_BASE=https://cars-img.jelnikar.dev node scripts/carinfo/images.ts sql`
- [x] 2.4 (Matija) Load the image SQL (**Supabase write**)

## 3. Display

- [x] 3.1 Confirm the credit line renders under every photo (CarPhoto/ModelHero), linked to the source page
- [x] 3.2 Spot-check 10 model pages at phone and desktop widths; confirm no broken image without a photo — 2026-11-02: Golf, Octavia, Clio, Duster, Jogger, Yaris, Qashqai, Fabia, Superb and Megane at 360/1280; 20 HTTP 200 responses, loaded photos, linked credits, zero horizontal overflow. Separately checked DS 3's missing-photo placeholder at both widths and both themes: no `<img>` rendered. Evidence: `data-raw/screens/model-photo-qa-20261102.json`, `data-raw/screens/model-states/`.
