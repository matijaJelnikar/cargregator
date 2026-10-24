# Car reports: progress

Generated 2026-10-24 12:16 UTC by `node scripts/carinfo/progress.ts`. Do not edit by hand.

**To continue:** rerun the same commands; each skips finished work.
1. `node scripts/carinfo/report.ts --all` writes reports, most registered first. Claude by default, or
   `--runner opencode --model opencode-go/<kimi-k2.7-code|minimax-m3>`.
2. `node scripts/carinfo/verify.ts` checks them.
3. `node scripts/carinfo/import.ts` writes SQL for new checked reports.
4. `node scripts/carinfo/progress.ts` refreshes this file.

Loading the SQL into Supabase is Matija's step. "exported" means the SQL was written, not that it was loaded.

## Summary

| state | generations |
|---|---|
| exported to SQL (handed to Matija to load) | 77 |
| held back (sources too weak, not exported) | 2 |
| checked, waiting for import.ts | 0 |
| written, waiting for verify.ts | 83 |
| failed (see reports/errors/, rerun) | 0 |
| not started | 656 |
| **total** | **818** |

Written by: claude/sonnet 162.

## Next up (first 30 not started, by registrations)

| rank | generation | registrations | written by |
|---|---|---|---|
| 131 | Alfa Romeo Giulietta (940) (`alfa-romeo-giulietta/940`) | 353,536 |  |
| 132 | Renault Twingo II (`renault-twingo/mk2`) | 352,495 |  |
| 133 | Hyundai i10 II (`hyundai-i10/mk2`) | 351,897 |  |
| 134 | Cupra Formentor (`cupra-formentor/mk1`) | 348,472 |  |
| 135 | Volvo V40 II (`volvo-v40/mk2`) | 345,648 |  |
| 136 | Peugeot 3008 I (`peugeot-3008/mk1`) | 339,943 |  |
| 138 | Renault Scénic IV (`renault-scenic/mk4`) | 329,250 |  |
| 139 | Jeep Compass II (`jeep-compass/mk2`) | 323,975 |  |
| 140 | Peugeot 108 (`peugeot-108/mk1`) | 323,422 |  |
| 141 | Citroën C5 Aircross I (`citroen-c5-aircross/mk1`) | 321,803 |  |
| 142 | Mitsubishi Space Star II (`mitsubishi-space-star/mk2`) | 320,681 |  |
| 145 | Opel Mokka II (Mokka-e) (`opel-mokka/mk2`) | 313,548 |  |
| 146 | Audi A1 II (`audi-a1/gb`) | 310,032 |  |
| 148 | Mercedes-Benz GLA (H247) (`mercedes-benz-gla/h247`) | 308,965 |  |
| 149 | Škoda Rapid (`skoda-rapid/mk1`) | 304,882 |  |
| 150 | BMW X1 (U11) (`bmw-x1/u11`) | 297,882 |  |
| 152 | Peugeot 207 (`peugeot-207/mk1`) | 297,659 |  |
| 153 | Citroën C1 II (`citroen-c1/mk2`) | 297,262 |  |
| 154 | Opel Grandland X (`opel-grandland/mk1`) | 297,159 |  |
| 155 | Volvo XC60 I (`volvo-xc60/mk1`) | 292,148 |  |
| 156 | Peugeot 508 I (`peugeot-508/mk1`) | 291,767 |  |
| 158 | Hyundai i10 III (`hyundai-i10/mk3`) | 289,245 |  |
| 159 | Citroën C4 III (`citroen-c4/mk3`) | 288,751 |  |
| 160 | Hyundai i20 III (`hyundai-i20/mk3`) | 288,651 |  |
| 161 | Mercedes-Benz E-Class (W212) (`mercedes-benz-e-class/w212`) | 287,826 |  |
| 162 | Nissan Juke II (F16) (`nissan-juke/f16`) | 287,611 |  |
| 163 | Citroën C4 Cactus (`citroen-c4/cactus`) | 286,579 |  |
| 164 | Toyota Aygo X (`toyota-aygo-x/mk1`) | 284,953 |  |
| 165 | Volkswagen Caddy IV (`volkswagen-caddy/mk4`) | 282,181 |  |
| 166 | Fiat Panda II (`fiat-panda/mk2`) | 281,277 |  |

## Failed

_none_

## Held back

| rank | generation | registrations | written by |
|---|---|---|---|
| 192 | Peugeot 308 I (`peugeot-308/mk1`) | 245,726 | claude/sonnet |
| 517 | Hyundai i30 I (FD) (`hyundai-i30/fd`) | 31,864 | claude/sonnet |

## Waiting for a check

| rank | generation | registrations | written by |
|---|---|---|---|
| 3 | Fiat Panda III (`fiat-panda/mk3`) | 1,979,459 | claude/sonnet |
| 4 | Fiat 500 (312) (`fiat-500/312`) | 1,675,542 | claude/sonnet |
| 5 | Peugeot 208 I (`peugeot-208/mk1`) | 1,488,893 | claude/sonnet |
| 6 | Volkswagen Polo V (`volkswagen-polo/mk5`) | 1,453,907 | claude/sonnet |
| 10 | Citroën C3 III (`citroen-c3/mk3`) | 1,293,929 | claude/sonnet |
| 11 | Volkswagen T-Roc I (`volkswagen-t-roc/mk1`) | 1,277,346 | claude/sonnet |
| 14 | Volkswagen Polo VI (`volkswagen-polo/mk6`) | 1,138,985 | claude/sonnet |
| 16 | Peugeot 208 II (`peugeot-208/mk2`) | 1,131,623 | claude/sonnet |
| 18 | Ford Fiesta VII (`ford-fiesta/mk7`) | 1,085,434 | claude/sonnet |
| 23 | Peugeot 3008 II (`peugeot-3008/mk2`) | 951,282 | claude/sonnet |
| 24 | BMW 1 Series (F20/F21) (`bmw-1-series/f20`) | 918,743 | claude/sonnet |
| 27 | Volkswagen up! (mk1) (`volkswagen-up/mk1`) | 883,409 | claude/sonnet |
| 28 | Peugeot 2008 I (`peugeot-2008/mk1`) | 864,985 | claude/sonnet |
| 32 | Peugeot 2008 II (`peugeot-2008/mk2`) | 812,808 | claude/sonnet |
| 33 | Audi A3 (8V) (`audi-a3/8v`) | 811,444 | claude/sonnet |
| 39 | Toyota Corolla E210 (`toyota-corolla/e210`) | 754,759 | claude/sonnet |
| 42 | SEAT Leon III (`seat-leon/mk3`) | 728,527 | claude/sonnet |
| 44 | Volkswagen T-Cross (`volkswagen-t-cross/mk1`) | 712,848 | claude/sonnet |
| 45 | Fiat Punto III (Grande Punto / Punto Evo) (`fiat-punto/mk3`) | 702,439 | claude/sonnet |
| 46 | Lancia Ypsilon III (`lancia-ypsilon/mk3`) | 696,978 | claude/sonnet |
| 47 | Toyota C-HR I (`toyota-c-hr/mk1`) | 693,713 | claude/sonnet |
| 48 | Citroën C3 II (`citroen-c3/mk2`) | 682,141 | claude/sonnet |
| 50 | Mercedes-Benz A-Class (W177) (`mercedes-benz-a-class/w177`) | 670,262 | claude/sonnet |
| 51 | Renault Twingo III (`renault-twingo/mk3`) | 658,801 | claude/sonnet |
| 53 | Toyota Yaris Cross (XP210) (`toyota-yaris-cross/xp210`) | 627,885 | claude/sonnet |
| 55 | Ford Fiesta VIII (`ford-fiesta/mk8`) | 616,228 | claude/sonnet |
| 56 | Tesla Model Y (`tesla-model-y/mk1`) | 613,349 | claude/sonnet |
| 58 | Ford Puma (2019) (`ford-puma/mk2`) | 590,193 | claude/sonnet |
| 59 | Fiat 500X (`fiat-500x/mk1`) | 586,437 | claude/sonnet |
| 60 | BMW X1 (F48) (`bmw-x1/f48`) | 574,374 | claude/sonnet |
| 61 | SEAT Arona (`seat-arona/kj`) | 561,183 | claude/sonnet |
| 62 | Volvo XC40 (`volvo-xc40/mk1`) | 551,112 | claude/sonnet |
| 63 | Škoda Karoq (`skoda-karoq/mk1`) | 550,748 | claude/sonnet |
| 64 | SEAT Ibiza V (`seat-ibiza/mk5`) | 548,777 | claude/sonnet |
| 66 | Opel Mokka I (Mokka X) (`opel-mokka/mk1`) | 540,551 | claude/sonnet |
| 67 | Toyota RAV4 V (`toyota-rav4/mk5`) | 538,105 | claude/sonnet |
| 69 | Hyundai Tucson IV (NX4) (`hyundai-tucson/nx4`) | 534,242 | claude/sonnet |
| 70 | Suzuki Vitara (LY) (`suzuki-vitara/ly`) | 532,652 | claude/sonnet |
| 71 | Volvo XC60 II (`volvo-xc60/mk2`) | 531,888 | claude/sonnet |
| 73 | MINI Cooper F56 (`mini-cooper/f56`) | 527,404 | claude/sonnet |
| 74 | Renault Kadjar (`renault-kadjar/mk1`) | 525,525 | claude/sonnet |
| 76 | Toyota Aygo II (`toyota-aygo/mk2`) | 518,389 | claude/sonnet |
| 77 | Volkswagen Touran II (`volkswagen-touran/mk2`) | 514,303 | claude/sonnet |
| 78 | Toyota Auris II (`toyota-auris/mk2`) | 512,467 | claude/sonnet |
| 79 | Mercedes-Benz GLC (X253) (`mercedes-benz-glc/x253`) | 511,218 | claude/sonnet |
| 81 | BMW 5 Series (F10/F11) (`bmw-5-series/f10`) | 508,972 | claude/sonnet |
| 83 | Mercedes-Benz A-Class (W176) (`mercedes-benz-a-class/w176`) | 500,497 | claude/sonnet |
| 84 | Ford C-Max II (`ford-c-max/mk2`) | 497,841 | claude/sonnet |
| 86 | Audi Q3 II (F3) (`audi-q3/f3`) | 492,171 | claude/sonnet |
| 87 | Fiat Tipo II (`fiat-tipo/356`) | 490,933 | claude/sonnet |
| 88 | Mercedes-Benz B-Class (W246) (`mercedes-benz-b-class/w246`) | 490,429 | claude/sonnet |
| 89 | Fiat 500L (`fiat-500l/mk1`) | 485,699 | claude/sonnet |
| 90 | Jeep Renegade (`jeep-renegade/mk1`) | 475,495 | claude/sonnet |
| 91 | Citroën C3 Aircross I (`citroen-c3-aircross/mk1`) | 471,700 | claude/sonnet |
| 93 | Mercedes-Benz E-Class (W213) (`mercedes-benz-e-class/w213`) | 467,515 | claude/sonnet |
| 94 | Hyundai Tucson III (TL) (`hyundai-tucson/tl`) | 464,463 | claude/sonnet |
| 95 | Škoda Kamiq (`skoda-kamiq/mk1`) | 463,429 | claude/sonnet |
| 96 | SEAT Ateca (`seat-ateca/mk1`) | 457,454 | claude/sonnet |
| 97 | Audi A1 I (`audi-a1/8x`) | 455,495 | claude/sonnet |
| 99 | Kia Picanto III (`kia-picanto/mk3`) | 441,005 | claude/sonnet |
| 102 | Opel Crossland X (`opel-crossland/mk1`) | 429,882 | claude/sonnet |
| 103 | SEAT Ibiza IV (`seat-ibiza/mk4`) | 428,017 | claude/sonnet |
| 104 | Volkswagen Golf Sportsvan (`volkswagen-golf-sportsvan/sportsvan`) | 426,469 | claude/sonnet |
| 105 | Nissan Juke I (F15) (`nissan-juke/f15`) | 425,774 | claude/sonnet |
| 108 | Audi Q2 (GA) (`audi-q2/ga`) | 417,641 | claude/sonnet |
| 109 | Audi A6 (C7) (`audi-a6/c7`) | 416,966 | claude/sonnet |
| 110 | Škoda Kodiaq I (`skoda-kodiaq/mk1`) | 416,033 | claude/sonnet |
| 111 | Hyundai i20 II (`hyundai-i20/mk2`) | 412,331 | claude/sonnet |
| 112 | Kia Stonic (`kia-stonic/mk1`) | 412,120 | claude/sonnet |
| 113 | Peugeot 5008 II (`peugeot-5008/mk2`) | 411,554 | claude/sonnet |
| 114 | Hyundai Kona I (`hyundai-kona/os`) | 407,334 | claude/sonnet |
| 116 | BMW 5 Series (G30/G31) (`bmw-5-series/g30`) | 400,275 | claude/sonnet |
| 117 | Audi A3 (8Y) (`audi-a3/8y`) | 395,187 | claude/sonnet |
| 119 | Ford EcoSport II (`ford-ecosport/mk2`) | 388,070 | claude/sonnet |
| 120 | BMW X3 (G01) (`bmw-x3/g01`) | 383,036 | claude/sonnet |
| 122 | Citroën C4 Picasso II (`citroen-c4-picasso/mk2`) | 376,916 | claude/sonnet |
| 123 | Audi Q3 I (8U) (`audi-q3/8u`) | 374,827 | claude/sonnet |
| 124 | Volkswagen Touran I (`volkswagen-touran/mk1`) | 372,297 | claude/sonnet |
| 125 | smart fortwo III (C453) (`smart-fortwo/c453`) | 369,597 | claude/sonnet |
| 126 | Audi Q5 II (FY) (`audi-q5/fy`) | 369,467 | claude/sonnet |
| 127 | BMW 1 Series (F40) (`bmw-1-series/f40`) | 363,138 | claude/sonnet |
| 128 | Dacia Logan II (`dacia-logan/mk2`) | 362,043 | claude/sonnet |
| 130 | Citroën C4 II (`citroen-c4/mk2`) | 359,670 | claude/sonnet |

## Checked, not exported

_none_

## Exported

| rank | generation | registrations | written by |
|---|---|---|---|
| 1 | Volkswagen Golf VII (`volkswagen-golf/mk7`) | 2,635,773 | claude/sonnet |
| 2 | Renault Clio IV (`renault-clio/mk4`) | 2,066,266 | claude/sonnet |
| 7 | Volkswagen Tiguan II (`volkswagen-tiguan/mk2`) | 1,317,535 | claude/sonnet |
| 8 | Renault Clio V (`renault-clio/mk5`) | 1,305,807 | claude/sonnet |
| 9 | Toyota Yaris III (`toyota-yaris/mk3`) | 1,304,954 | claude/sonnet |
| 12 | Škoda Octavia III (`skoda-octavia/mk3`) | 1,203,030 | claude/sonnet |
| 13 | Dacia Sandero II (`dacia-sandero/mk2`) | 1,192,943 | claude/sonnet |
| 15 | Dacia Sandero III (`dacia-sandero/mk3`) | 1,132,334 | claude/sonnet |
| 17 | Renault Captur I (`renault-captur/mk1`) | 1,124,824 | claude/sonnet |
| 19 | Volkswagen Passat B8 (`volkswagen-passat/b8`) | 1,071,441 | claude/sonnet |
| 20 | Nissan Qashqai II (J11) (`nissan-qashqai/j11`) | 1,055,996 | claude/sonnet |
| 21 | Dacia Duster II (`dacia-duster/mk2`) | 1,023,169 | claude/sonnet |
| 22 | Peugeot 308 II (`peugeot-308/mk2`) | 1,012,170 | claude/sonnet |
| 25 | Ford Focus III (`ford-focus/mk3`) | 913,243 | claude/sonnet |
| 26 | Volkswagen Golf VIII (`volkswagen-golf/mk8`) | 911,503 | claude/sonnet |
| 29 | Opel Corsa F (`opel-corsa/f`) | 836,831 | claude/sonnet |
| 30 | Škoda Fabia III (`skoda-fabia/mk3`) | 832,071 | claude/sonnet |
| 31 | Dacia Duster I (`dacia-duster/mk1`) | 814,263 | claude/sonnet |
| 34 | Renault Captur II (`renault-captur/mk2`) | 795,939 | claude/sonnet |
| 35 | Renault Mégane III (`renault-megane/mk3`) | 778,055 | claude/sonnet |
| 36 | Toyota Yaris IV (`toyota-yaris/mk4`) | 770,205 | claude/sonnet |
| 37 | Opel Corsa E (`opel-corsa/e`) | 757,848 | claude/sonnet |
| 38 | BMW 3 Series (F30/F31) (`bmw-3-series/f30`) | 756,173 | claude/sonnet |
| 40 | Renault Mégane IV (`renault-megane/mk4`) | 738,999 | claude/sonnet |
| 41 | Škoda Octavia IV (`skoda-octavia/mk4`) | 732,895 | claude/sonnet |
| 43 | Mercedes-Benz C-Class (W205) (`mercedes-benz-c-class/w205`) | 722,073 | claude/sonnet |
| 49 | Volkswagen Golf VI (`volkswagen-golf/mk6`) | 671,648 | claude/sonnet |
| 52 | Ford Focus IV (`ford-focus/mk4`) | 640,549 | claude/sonnet |
| 54 | Opel Astra K (`opel-astra/k`) | 617,728 | claude/sonnet |
| 57 | Audi A4 (B9) (`audi-a4/b9`) | 612,067 | claude/sonnet |
| 65 | Volkswagen Tiguan I (`volkswagen-tiguan/mk1`) | 543,390 | claude/sonnet |
| 68 | Volkswagen Passat B7 (`volkswagen-passat/b7`) | 534,735 | claude/sonnet |
| 72 | Ford Kuga II (`ford-kuga/mk2`) | 528,001 | claude/sonnet |
| 75 | Renault Clio III (`renault-clio/mk3`) | 520,281 | claude/sonnet |
| 80 | Opel Astra J (`opel-astra/j`) | 510,612 | claude/sonnet |
| 82 | BMW 3 Series (G20/G21) (`bmw-3-series/g20`) | 505,449 | claude/sonnet |
| 85 | Opel Corsa D (`opel-corsa/d`) | 492,961 | claude/sonnet |
| 92 | Ford Kuga III (`ford-kuga/mk3`) | 469,849 | claude/sonnet |
| 98 | Škoda Superb III (`skoda-superb/mk3`) | 454,085 | claude/sonnet |
| 100 | Hyundai i30 III (PD) (`hyundai-i30/pd`) | 439,050 | claude/sonnet |
| 101 | Audi A4 (B8) (`audi-a4/b8`) | 436,955 | claude/sonnet |
| 106 | Kia Ceed III (`kia-ceed/mk3`) | 424,677 | claude/sonnet |
| 107 | Kia Sportage V (NQ5) (`kia-sportage/nq5`) | 422,760 | claude/sonnet |
| 115 | Kia Sportage IV (QL) (`kia-sportage/ql`) | 401,526 | claude/sonnet |
| 118 | Nissan Qashqai III (J12) (`nissan-qashqai/j12`) | 388,670 | claude/sonnet |
| 121 | Nissan Qashqai I (J10) (`nissan-qashqai/j10`) | 380,524 | claude/sonnet |
| 129 | Škoda Fabia II (`skoda-fabia/mk2`) | 361,281 | claude/sonnet |
| 137 | Mercedes-Benz C-Class (W204) (`mercedes-benz-c-class/w204`) | 336,807 | claude/sonnet |
| 143 | Peugeot 308 III (`peugeot-308/mk3`) | 319,323 | claude/sonnet |
| 144 | Kia Ceed II (`kia-ceed/mk2`) | 316,010 | claude/sonnet |
| 147 | Škoda Fabia IV (`skoda-fabia/mk4`) | 309,564 | claude/sonnet |
| 151 | Tesla Model 3 (`tesla-model-3/mk1`) | 297,747 | claude/sonnet |
| 157 | Hyundai i30 II (GD) (`hyundai-i30/gd`) | 289,563 | claude/sonnet |
| 171 | Kia Sportage III (SL) (`kia-sportage/sl`) | 274,446 | claude/sonnet |
| 189 | Volkswagen Tiguan III (`volkswagen-tiguan/mk3`) | 251,074 | claude/sonnet |
| 201 | Škoda Octavia II (`skoda-octavia/mk2`) | 231,669 | claude/sonnet |
| 203 | Mercedes-Benz C-Class (W206) (`mercedes-benz-c-class/w206`) | 230,668 | claude/sonnet |
| 214 | Dacia Duster III (`dacia-duster/mk3`) | 223,177 | claude/sonnet |
| 231 | Tesla Model 3 (Highland) (`tesla-model-3/highland`) | 197,472 | claude/sonnet |
| 248 | Opel Astra L (`opel-astra/l`) | 180,458 | claude/sonnet |
| 278 | BMW 3 Series (E90/E91/E92/E93) (`bmw-3-series/e90`) | 146,515 | claude/sonnet |
| 279 | Škoda Superb II (`skoda-superb/mk2`) | 145,620 | claude/sonnet |
| 285 | Dacia Sandero I (`dacia-sandero/mk1`) | 140,023 | claude/sonnet |
| 304 | Volkswagen Passat B9 (`volkswagen-passat/b9`) | 116,030 | claude/sonnet |
| 315 | Renault Mégane E-Tech Electric (`renault-megane/e-tech`) | 112,094 | claude/sonnet |
| 316 | BMW 3 Series Gran Turismo (F34) (`bmw-3-series/f34`) | 110,942 | claude/sonnet |
| 359 | Ford Kuga I (`ford-kuga/mk1`) | 80,392 | claude/sonnet |
| 385 | Toyota Yaris II (`toyota-yaris/mk2`) | 69,227 | claude/sonnet |
| 386 | Škoda Superb IV (`skoda-superb/mk4`) | 69,150 | claude/sonnet |
| 483 | Kia Ceed I (`kia-ceed/mk1`) | 40,182 | claude/sonnet |
| 488 | Ford Focus II (`ford-focus/mk2`) | 38,166 | claude/sonnet |
| 588 | Opel Astra H (`opel-astra/h`) | 20,696 | claude/sonnet |
| 615 | Toyota Yaris GR Yaris (`toyota-yaris/gr-yaris`) | 16,901 | claude/sonnet |
| 663 | Volkswagen Passat CC (`volkswagen-passat/cc`) | 8,310 | claude/sonnet |
| 709 | Renault Clio VI (`renault-clio/mk6`) | 3,320 | claude/sonnet |
| 758 | Škoda Octavia I (`skoda-octavia/mk1`) | 456 | claude/sonnet |
| 790 | Škoda Fabia I (`skoda-fabia/mk1`) | 46 | claude/sonnet |
