# Tasks

## 1. Hosting

- [ ] 1.1 (Matija) Create the R2 bucket `cargregator` and connect the custom domain (suggested `cars-img.jelnikar.dev`)
- [ ] 1.2 (Matija) `! npx wrangler login`

## 2. Photos

- [ ] 2.1 `node scripts/carinfo/images.ts recheck` and review what it drops
- [ ] 2.2 `node scripts/carinfo/images.ts upload`
- [ ] 2.3 `IMG_BASE=https://cars-img.jelnikar.dev node scripts/carinfo/images.ts sql`
- [ ] 2.4 (Matija) Load the image SQL (**Supabase write**)

## 3. Display

- [ ] 3.1 Confirm the credit line renders under every photo (CarPhoto/ModelHero), linked to the source page
- [ ] 3.2 Spot-check 10 model pages at phone and desktop widths; confirm no broken image without a photo
