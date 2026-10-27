# Car reports: progress

Generated 2026-10-27 19:15 UTC by `node scripts/carinfo/progress.ts`. Do not edit by hand.

**To continue:** rerun the same commands; each skips finished work.
1. `node scripts/carinfo/report.ts --all` writes reports, most registered first. Claude by default, or
   `--runner opencode --model opencode-go/<kimi-k2.7-code|minimax-m3|gpt-5.6-luna>`.
2. `node scripts/carinfo/verify.ts` checks them.
3. `node scripts/carinfo/import.ts` writes SQL for new checked reports.
4. `node scripts/carinfo/progress.ts` refreshes this file.

Loading the SQL into Supabase is Matija's step. "exported" means the SQL was written, not that it was loaded.

## Summary

| state | generations |
|---|---|
| exported to SQL (handed to Matija to load) | 417 |
| held back (sources too weak, not exported) | 16 |
| checked, waiting for import.ts | 0 |
| written, waiting for verify.ts | 87 |
| failed (see reports/errors/, rerun) | 3 |
| not started | 295 |
| **total** | **818** |

Written by: claude/sonnet 379, opencode/opencode-go/gpt-5.6-luna 87, opencode/opencode-go/kimi-k2.7-code 6, opencode/opencode-go/minimax-m3 48.

## Next up (first 30 not started, by registrations)

| rank | generation | registrations | written by |
|---|---|---|---|
| 370 | Renault Kangoo III (`renault-kangoo/mk3`) | 76,403 |  |
| 371 | BMW 5 Series (G60/G61) (`bmw-5-series/g60`) | 76,129 |  |
| 372 | Alfa Romeo Giulia (952) (`alfa-romeo-giulia/952`) | 76,018 |  |
| 373 | DS DS 3 Crossback (`ds-ds-3/crossback`) | 75,369 |  |
| 374 | Škoda Elroq (`skoda-elroq/mk1`) | 74,961 |  |
| 375 | BMW X4 (F26) (`bmw-x4/f26`) | 73,595 |  |
| 376 | Mercedes-Benz S-Class (W222) (`mercedes-benz-s-class/w222`) | 72,636 |  |
| 377 | Porsche 911 (991) (`porsche-911/991`) | 72,508 |  |
| 378 | Opel Combo E (`opel-combo/combo-e`) | 72,147 |  |
| 379 | Volvo XC70 III (`volvo-xc70/p24`) | 72,062 |  |
| 380 | Hyundai Tucson ix35 (LM) (`hyundai-tucson/lm`) | 71,590 |  |
| 381 | Kia Carens IV (`kia-carens/mk4`) | 71,049 |  |
| 382 | Honda Jazz III (`honda-jazz/mk3`) | 70,595 |  |
| 383 | Jaguar F-Pace (X761) (`jaguar-f-pace/x761`) | 70,472 |  |
| 384 | MG ZS II (`mg-zs/mk2`) | 69,820 |  |
| 387 | DS DS 3 (`ds-ds-3/mk1`) | 68,287 |  |
| 388 | Nissan X-Trail IV (T33) (`nissan-x-trail/t33`) | 67,831 |  |
| 389 | Porsche Cayenne II (958) (`porsche-cayenne/958`) | 67,737 |  |
| 390 | Toyota Prius+ (`toyota-prius/zvw40`) | 66,993 |  |
| 391 | BMW 2 Series Gran Coupé (F44) (`bmw-2-series/f44`) | 66,871 |  |
| 392 | Jeep Grand Cherokee IV (WK2) (`jeep-grand-cherokee/wk2`) | 66,829 |  |
| 393 | Mazda MX-5 IV (ND) (`mazda-mx-5/nd`) | 66,612 |  |
| 394 | Mazda CX-60 (`mazda-cx-60/kh`) | 65,835 |  |
| 395 | Mercedes-Benz E-Class Coupe/Cabriolet (C207) (`mercedes-benz-e-class/c207`) | 65,812 |  |
| 396 | Ford Galaxy III (`ford-galaxy/mk3`) | 65,772 |  |
| 397 | MINI Cooper J01 (`mini-cooper/j01`) | 64,939 |  |
| 398 | Suzuki SX4 I (`suzuki-sx4/mk1`) | 64,388 |  |
| 399 | Cupra Born (`cupra-born/k1`) | 64,062 |  |
| 400 | BYD Seal U (`byd-seal-u/mk1`) | 63,622 |  |
| 401 | Honda CR-V V (`honda-cr-v/mk5`) | 63,378 |  |

## Failed

| rank | generation | registrations | written by |
|---|---|---|---|
| 369 | Hyundai Ioniq (AE) (`hyundai-ioniq/mk1`) | 76,899 |  |
| 673 | Peugeot Boxer III (`peugeot-boxer/mk3`) | 7,497 |  |
| 674 | Subaru Levorg I (`subaru-levorg/vm`) | 7,386 |  |

## Held back

| rank | generation | registrations | written by |
|---|---|---|---|
| 130 | Citroën C4 II (`citroen-c4/mk2`) | 359,670 | claude/sonnet |
| 192 | Peugeot 308 I (`peugeot-308/mk1`) | 245,726 | claude/sonnet |
| 242 | Opel Zafira Tourer C (`opel-zafira/tourer-c`) | 186,280 | claude/sonnet |
| 261 | Kia Venga (`kia-venga/mk1`) | 167,855 | claude/sonnet |
| 293 | Škoda Kodiaq II (`skoda-kodiaq/mk2`) | 130,554 | claude/sonnet |
| 307 | MINI Clubman (F54) (`mini-clubman/f54`) | 114,793 | claude/sonnet |
| 323 | Ford Transit Custom I (`ford-transit-custom/mk1`) | 106,755 | claude/sonnet |
| 347 | Toyota Proace II (`toyota-proace/mk2`) | 88,818 | claude/sonnet |
| 353 | Mercedes-Benz E-Class (W214) (`mercedes-benz-e-class/w214`) | 84,446 | claude/sonnet |
| 368 | Suzuki Jimny III (`suzuki-jimny/mk3`) | 76,932 | claude/sonnet |
| 517 | Hyundai i30 I (FD) (`hyundai-i30/fd`) | 31,864 | claude/sonnet |
| 767 | Mercedes-Benz SLK (R171) (`mercedes-benz-slk/r171`) | 354 | opencode/opencode-go/kimi-k2.7-code |
| 771 | Citroën C4 I (`citroen-c4/mk1`) | 235 | opencode/opencode-go/minimax-m3 |
| 791 | Toyota Proace I (`toyota-proace/mk1`) | 41 | opencode/opencode-go/minimax-m3 |
| 811 | Peugeot 307 (`peugeot-307/mk1`) | 0 | opencode/opencode-go/minimax-m3 |
| 817 | Volkswagen Amarok I (`volkswagen-amarok/2h`) | 0 | opencode/opencode-go/minimax-m3 |

## Waiting for a check

| rank | generation | registrations | written by |
|---|---|---|---|
| 675 | Porsche Cayman (981) (`porsche-cayman/981`) | 7,245 | opencode/opencode-go/gpt-5.6-luna |
| 676 | BMW M5 (G90) (`bmw-m5/g90`) | 6,786 | opencode/opencode-go/gpt-5.6-luna |
| 677 | Citroën C5 Aircross II (`citroen-c5-aircross/mk2`) | 6,645 | opencode/opencode-go/gpt-5.6-luna |
| 678 | Renault Grand Scénic IV (`renault-grand-scenic/mk4`) | 6,569 | opencode/opencode-go/gpt-5.6-luna |
| 679 | BMW M3 (F80) (`bmw-m3/f80`) | 6,506 | opencode/opencode-go/gpt-5.6-luna |
| 680 | Kia Picanto I (`kia-picanto/mk1`) | 6,224 | opencode/opencode-go/gpt-5.6-luna |
| 681 | Nissan Pathfinder III (R51) (`nissan-pathfinder/r51`) | 6,130 | opencode/opencode-go/gpt-5.6-luna |
| 682 | Citroën C5 X (`citroen-c5/c5-x`) | 6,032 | opencode/opencode-go/gpt-5.6-luna |
| 683 | Mitsubishi Outlander IV (`mitsubishi-outlander/mk4`) | 5,969 | opencode/opencode-go/gpt-5.6-luna |
| 684 | Porsche Taycan (J1 facelift) (`porsche-taycan/j1-facelift`) | 5,717 | opencode/opencode-go/gpt-5.6-luna |
| 685 | Jaguar XJ (X351) (`jaguar-xj/x351`) | 5,660 | opencode/opencode-go/gpt-5.6-luna |
| 686 | Citroën Jumper III (`citroen-jumper/mk3`) | 5,554 | opencode/opencode-go/gpt-5.6-luna |
| 687 | Toyota Prius V (`toyota-prius/xw60`) | 5,552 | opencode/opencode-go/gpt-5.6-luna |
| 688 | Subaru Impreza IV (`subaru-impreza/gj`) | 5,496 | opencode/opencode-go/gpt-5.6-luna |
| 689 | Chevrolet Camaro VI (`chevrolet-camaro/mk6`) | 5,155 | opencode/opencode-go/gpt-5.6-luna |
| 690 | Tesla Model S (2021 refresh, Plaid) (`tesla-model-s/mk2`) | 5,078 | opencode/opencode-go/gpt-5.6-luna |
| 691 | Volkswagen T-Roc II (`volkswagen-t-roc/mk2`) | 5,064 | opencode/opencode-go/gpt-5.6-luna |
| 692 | BMW M5 (F10) (`bmw-m5/f10`) | 5,059 | opencode/opencode-go/gpt-5.6-luna |
| 693 | MINI Countryman (R60) (`mini-countryman/r60`) | 4,964 | opencode/opencode-go/gpt-5.6-luna |
| 694 | Volkswagen California T7 (`volkswagen-california/t7`) | 4,933 | opencode/opencode-go/gpt-5.6-luna |
| 695 | Polestar 3 Polestar 3 (`polestar-3/mk1`) | 4,923 | opencode/opencode-go/gpt-5.6-luna |
| 696 | Subaru Solterra (`subaru-solterra/mk1`) | 4,820 | opencode/opencode-go/gpt-5.6-luna |
| 697 | Ford Mustang VII (S650) (`ford-mustang/s650`) | 4,772 | opencode/opencode-go/gpt-5.6-luna |
| 698 | Subaru Forester VI (`subaru-forester/sl`) | 4,678 | opencode/opencode-go/gpt-5.6-luna |
| 699 | Fiat Doblò III (`fiat-doblo/mk3`) | 4,620 | opencode/opencode-go/gpt-5.6-luna |
| 700 | Audi e-tron Q7 e-tron (`audi-e-tron/4l`) | 4,613 | opencode/opencode-go/gpt-5.6-luna |
| 701 | MINI Clubman (R55) (`mini-clubman/r55`) | 4,442 | opencode/opencode-go/gpt-5.6-luna |
| 702 | Subaru Impreza V (`subaru-impreza/gk`) | 4,420 | opencode/opencode-go/gpt-5.6-luna |
| 703 | Volkswagen Transporter T7 (`volkswagen-transporter/t7`) | 4,416 | opencode/opencode-go/gpt-5.6-luna |
| 704 | Subaru Impreza III (`subaru-impreza/gh`) | 4,297 | opencode/opencode-go/gpt-5.6-luna |
| 705 | Toyota Supra (A90) (`toyota-supra/a90`) | 4,013 | opencode/opencode-go/gpt-5.6-luna |
| 706 | BMW M3 (E90/E92/E93) (`bmw-m3/e92`) | 3,868 | opencode/opencode-go/gpt-5.6-luna |
| 707 | Toyota GR86 (ZN8) (`toyota-gr86/zn8`) | 3,783 | opencode/opencode-go/gpt-5.6-luna |
| 708 | Toyota Prius Plug-in Hybrid (III) (`toyota-prius/xw35`) | 3,718 | opencode/opencode-go/gpt-5.6-luna |
| 710 | Peugeot Expert IV (`peugeot-expert/mk4`) | 3,259 | opencode/opencode-go/gpt-5.6-luna |
| 711 | Saab 9-3 II (`saab-9-3/mk2`) | 3,215 | opencode/opencode-go/gpt-5.6-luna |
| 712 | Peugeot 407 (`peugeot-407/mk1`) | 3,208 | opencode/opencode-go/gpt-5.6-luna |
| 713 | Honda e Honda e (`honda-e/mk1`) | 3,072 | opencode/opencode-go/gpt-5.6-luna |
| 714 | Audi e-tron Q6 e-tron (`audi-e-tron/gf`) | 3,032 | opencode/opencode-go/gpt-5.6-luna |
| 715 | Toyota Camry IX (XV80) (`toyota-camry/xv80`) | 2,965 | opencode/opencode-go/gpt-5.6-luna |
| 716 | Chevrolet Corvette C8 (`chevrolet-corvette/c8`) | 2,956 | opencode/opencode-go/gpt-5.6-luna |
| 717 | Chevrolet Camaro V (`chevrolet-camaro/mk5`) | 2,950 | opencode/opencode-go/gpt-5.6-luna |
| 718 | Volkswagen Transporter T5 (`volkswagen-transporter/t5`) | 2,866 | opencode/opencode-go/gpt-5.6-luna |
| 719 | Chevrolet Corvette C7 (`chevrolet-corvette/c7`) | 2,858 | opencode/opencode-go/gpt-5.6-luna |
| 720 | Porsche 718 Boxster/Cayman (982) (`porsche-718/982`) | 2,774 | opencode/opencode-go/gpt-5.6-luna |
| 721 | Peugeot Boxer II (`peugeot-boxer/mk2`) | 2,698 | opencode/opencode-go/gpt-5.6-luna |
| 722 | Mercedes-Benz ML (W164) (`mercedes-benz-ml/w164`) | 2,676 | opencode/opencode-go/gpt-5.6-luna |
| 723 | Toyota Land Cruiser 200 (`toyota-land-cruiser/j200`) | 2,670 | opencode/opencode-go/gpt-5.6-luna |
| 724 | Audi RS4 (B8) (`audi-rs4/b8`) | 2,659 | opencode/opencode-go/gpt-5.6-luna |
| 725 | Subaru WRX STI (VA) (`subaru-wrx/va`) | 2,648 | opencode/opencode-go/gpt-5.6-luna |
| 726 | Lexus IS II (`lexus-is/xe20`) | 2,626 | opencode/opencode-go/gpt-5.6-luna |
| 727 | Jeep Grand Cherokee V (WL) (`jeep-grand-cherokee/wl`) | 2,498 | opencode/opencode-go/gpt-5.6-luna |
| 728 | Fiat Punto II (`fiat-punto/mk2`) | 2,410 | opencode/opencode-go/gpt-5.6-luna |
| 729 | Land Rover Range Rover III (L322) (`land-rover-range-rover/l322`) | 2,367 | opencode/opencode-go/gpt-5.6-luna |
| 730 | Citroën Jumper II (`citroen-jumper/mk2`) | 2,177 | opencode/opencode-go/gpt-5.6-luna |
| 731 | Kia Rio II (`kia-rio/mk2`) | 2,085 | opencode/opencode-go/gpt-5.6-luna |
| 732 | Audi A6 Allroad (C6) (`audi-a6-allroad/c6`) | 2,078 | opencode/opencode-go/gpt-5.6-luna |
| 733 | Subaru BRZ I (`subaru-brz/zc6`) | 2,036 | opencode/opencode-go/gpt-5.6-luna |
| 734 | Citroën DS3 Crossback (`citroen-ds3/crossback`) | 2,026 | opencode/opencode-go/gpt-5.6-luna |
| 735 | Audi S3 (8P) (`audi-s3/8p`) | 1,849 | opencode/opencode-go/gpt-5.6-luna |
| 736 | Porsche 911 (997) (`porsche-911/997`) | 1,783 | opencode/opencode-go/gpt-5.6-luna |
| 737 | Suzuki Swift III (`suzuki-swift/mk3`) | 1,748 | opencode/opencode-go/gpt-5.6-luna |
| 738 | Subaru BRZ II (`subaru-brz/zd8`) | 1,545 | opencode/opencode-go/gpt-5.6-luna |
| 739 | Saab 9-5 II (`saab-9-5/mk2`) | 1,450 | opencode/opencode-go/gpt-5.6-luna |
| 740 | Fiat Ducato III facelift (2021) (`fiat-ducato/250-2021`) | 1,217 | opencode/opencode-go/gpt-5.6-luna |
| 741 | BMW iX3 Neue Klasse (`bmw-ix3/neue-klasse`) | 1,190 | opencode/opencode-go/gpt-5.6-luna |
| 742 | Subaru Outback IV (`subaru-outback/mk4`) | 1,088 | opencode/opencode-go/gpt-5.6-luna |
| 743 | Jeep Cherokee (Liberty) KK (`jeep-cherokee/kk`) | 1,052 | opencode/opencode-go/gpt-5.6-luna |
| 744 | Ford Transit Connect III (`ford-transit/connect-mk3`) | 1,049 | opencode/opencode-go/gpt-5.6-luna |
| 745 | Kia ProCeed pro_cee'd II (JD) (`kia-proceed/jd`) | 1,016 | opencode/opencode-go/gpt-5.6-luna |
| 746 | Volkswagen Crafter II (`volkswagen-crafter/mk2`) | 961 | opencode/opencode-go/gpt-5.6-luna |
| 747 | Audi RS3 (8P) (`audi-rs3/8p`) | 833 | opencode/opencode-go/gpt-5.6-luna |
| 748 | Porsche Boxster (987) (`porsche-boxster/987`) | 821 | opencode/opencode-go/gpt-5.6-luna |
| 749 | Suzuki Vitara e Vitara (`suzuki-vitara/e-vitara`) | 783 | opencode/opencode-go/gpt-5.6-luna |
| 750 | Volkswagen Transporter T6 (`volkswagen-transporter/t6`) | 731 | opencode/opencode-go/gpt-5.6-luna |
| 751 | Nissan Micra VI (`nissan-micra/k15`) | 729 | opencode/opencode-go/gpt-5.6-luna |
| 752 | Kia ProCeed pro_cee'd I (ED) (`kia-proceed/ed`) | 719 | opencode/opencode-go/gpt-5.6-luna |
| 753 | Mercedes-Benz SL (R230) (`mercedes-benz-sl/r230`) | 620 | opencode/opencode-go/gpt-5.6-luna |
| 754 | Volkswagen Transporter T6.1 (`volkswagen-transporter/t61`) | 618 | opencode/opencode-go/gpt-5.6-luna |
| 755 | Renault Master IV (`renault-master/mk4`) | 593 | opencode/opencode-go/gpt-5.6-luna |
| 756 | Porsche Cayenne Electric (`porsche-cayenne/electric`) | 464 | opencode/opencode-go/gpt-5.6-luna |
| 757 | Porsche Cayman (987) (`porsche-cayman/987`) | 462 | opencode/opencode-go/gpt-5.6-luna |
| 759 | Mercedes-Benz G-Class (W461) (`mercedes-benz-g-class/w461`) | 443 | opencode/opencode-go/gpt-5.6-luna |
| 761 | Ford Tourneo Connect I (`ford-tourneo-connect/mk1`) | 400 | opencode/opencode-go/gpt-5.6-luna |
| 763 | Opel Combo C (`opel-combo/combo-c`) | 389 | opencode/opencode-go/gpt-5.6-luna |
| 764 | Nissan Micra III (`nissan-micra/k12`) | 371 | opencode/opencode-go/gpt-5.6-luna |
| 768 | Alfa Romeo 147 (`alfa-romeo-147/mk1`) | 314 | opencode/opencode-go/gpt-5.6-luna |

## Checked, not exported

_none_

## Exported

| rank | generation | registrations | written by |
|---|---|---|---|
| 1 | Volkswagen Golf VII (`volkswagen-golf/mk7`) | 2,635,773 | claude/sonnet |
| 2 | Renault Clio IV (`renault-clio/mk4`) | 2,066,266 | claude/sonnet |
| 3 | Fiat Panda III (`fiat-panda/mk3`) | 1,979,459 | claude/sonnet |
| 4 | Fiat 500 (312) (`fiat-500/312`) | 1,675,542 | claude/sonnet |
| 5 | Peugeot 208 I (`peugeot-208/mk1`) | 1,488,893 | claude/sonnet |
| 6 | Volkswagen Polo V (`volkswagen-polo/mk5`) | 1,453,907 | claude/sonnet |
| 7 | Volkswagen Tiguan II (`volkswagen-tiguan/mk2`) | 1,317,535 | claude/sonnet |
| 8 | Renault Clio V (`renault-clio/mk5`) | 1,305,807 | claude/sonnet |
| 9 | Toyota Yaris III (`toyota-yaris/mk3`) | 1,304,954 | claude/sonnet |
| 10 | Citroën C3 III (`citroen-c3/mk3`) | 1,293,929 | claude/sonnet |
| 11 | Volkswagen T-Roc I (`volkswagen-t-roc/mk1`) | 1,277,346 | claude/sonnet |
| 12 | Škoda Octavia III (`skoda-octavia/mk3`) | 1,203,030 | claude/sonnet |
| 13 | Dacia Sandero II (`dacia-sandero/mk2`) | 1,192,943 | claude/sonnet |
| 14 | Volkswagen Polo VI (`volkswagen-polo/mk6`) | 1,138,985 | claude/sonnet |
| 15 | Dacia Sandero III (`dacia-sandero/mk3`) | 1,132,334 | claude/sonnet |
| 16 | Peugeot 208 II (`peugeot-208/mk2`) | 1,131,623 | claude/sonnet |
| 17 | Renault Captur I (`renault-captur/mk1`) | 1,124,824 | claude/sonnet |
| 18 | Ford Fiesta VII (`ford-fiesta/mk7`) | 1,085,434 | claude/sonnet |
| 19 | Volkswagen Passat B8 (`volkswagen-passat/b8`) | 1,071,441 | claude/sonnet |
| 20 | Nissan Qashqai II (J11) (`nissan-qashqai/j11`) | 1,055,996 | claude/sonnet |
| 21 | Dacia Duster II (`dacia-duster/mk2`) | 1,023,169 | claude/sonnet |
| 22 | Peugeot 308 II (`peugeot-308/mk2`) | 1,012,170 | claude/sonnet |
| 23 | Peugeot 3008 II (`peugeot-3008/mk2`) | 951,282 | claude/sonnet |
| 24 | BMW 1 Series (F20/F21) (`bmw-1-series/f20`) | 918,743 | claude/sonnet |
| 25 | Ford Focus III (`ford-focus/mk3`) | 913,243 | claude/sonnet |
| 26 | Volkswagen Golf VIII (`volkswagen-golf/mk8`) | 911,503 | claude/sonnet |
| 27 | Volkswagen up! (mk1) (`volkswagen-up/mk1`) | 883,409 | claude/sonnet |
| 28 | Peugeot 2008 I (`peugeot-2008/mk1`) | 864,985 | claude/sonnet |
| 29 | Opel Corsa F (`opel-corsa/f`) | 836,831 | claude/sonnet |
| 30 | Škoda Fabia III (`skoda-fabia/mk3`) | 832,071 | claude/sonnet |
| 31 | Dacia Duster I (`dacia-duster/mk1`) | 814,263 | claude/sonnet |
| 32 | Peugeot 2008 II (`peugeot-2008/mk2`) | 812,808 | claude/sonnet |
| 33 | Audi A3 (8V) (`audi-a3/8v`) | 811,444 | claude/sonnet |
| 34 | Renault Captur II (`renault-captur/mk2`) | 795,939 | claude/sonnet |
| 35 | Renault Mégane III (`renault-megane/mk3`) | 778,055 | claude/sonnet |
| 36 | Toyota Yaris IV (`toyota-yaris/mk4`) | 770,205 | claude/sonnet |
| 37 | Opel Corsa E (`opel-corsa/e`) | 757,848 | claude/sonnet |
| 38 | BMW 3 Series (F30/F31) (`bmw-3-series/f30`) | 756,173 | claude/sonnet |
| 39 | Toyota Corolla E210 (`toyota-corolla/e210`) | 754,759 | claude/sonnet |
| 40 | Renault Mégane IV (`renault-megane/mk4`) | 738,999 | claude/sonnet |
| 41 | Škoda Octavia IV (`skoda-octavia/mk4`) | 732,895 | claude/sonnet |
| 42 | SEAT Leon III (`seat-leon/mk3`) | 728,527 | claude/sonnet |
| 43 | Mercedes-Benz C-Class (W205) (`mercedes-benz-c-class/w205`) | 722,073 | claude/sonnet |
| 44 | Volkswagen T-Cross (`volkswagen-t-cross/mk1`) | 712,848 | claude/sonnet |
| 45 | Fiat Punto III (Grande Punto / Punto Evo) (`fiat-punto/mk3`) | 702,439 | claude/sonnet |
| 46 | Lancia Ypsilon III (`lancia-ypsilon/mk3`) | 696,978 | claude/sonnet |
| 47 | Toyota C-HR I (`toyota-c-hr/mk1`) | 693,713 | claude/sonnet |
| 48 | Citroën C3 II (`citroen-c3/mk2`) | 682,141 | claude/sonnet |
| 49 | Volkswagen Golf VI (`volkswagen-golf/mk6`) | 671,648 | claude/sonnet |
| 50 | Mercedes-Benz A-Class (W177) (`mercedes-benz-a-class/w177`) | 670,262 | claude/sonnet |
| 51 | Renault Twingo III (`renault-twingo/mk3`) | 658,801 | claude/sonnet |
| 52 | Ford Focus IV (`ford-focus/mk4`) | 640,549 | claude/sonnet |
| 53 | Toyota Yaris Cross (XP210) (`toyota-yaris-cross/xp210`) | 627,885 | claude/sonnet |
| 54 | Opel Astra K (`opel-astra/k`) | 617,728 | claude/sonnet |
| 55 | Ford Fiesta VIII (`ford-fiesta/mk8`) | 616,228 | claude/sonnet |
| 56 | Tesla Model Y (`tesla-model-y/mk1`) | 613,349 | claude/sonnet |
| 57 | Audi A4 (B9) (`audi-a4/b9`) | 612,067 | claude/sonnet |
| 58 | Ford Puma (2019) (`ford-puma/mk2`) | 590,193 | claude/sonnet |
| 59 | Fiat 500X (`fiat-500x/mk1`) | 586,437 | claude/sonnet |
| 60 | BMW X1 (F48) (`bmw-x1/f48`) | 574,374 | claude/sonnet |
| 61 | SEAT Arona (`seat-arona/kj`) | 561,183 | claude/sonnet |
| 62 | Volvo XC40 (`volvo-xc40/mk1`) | 551,112 | claude/sonnet |
| 63 | Škoda Karoq (`skoda-karoq/mk1`) | 550,748 | claude/sonnet |
| 64 | SEAT Ibiza V (`seat-ibiza/mk5`) | 548,777 | claude/sonnet |
| 65 | Volkswagen Tiguan I (`volkswagen-tiguan/mk1`) | 543,390 | claude/sonnet |
| 66 | Opel Mokka I (Mokka X) (`opel-mokka/mk1`) | 540,551 | claude/sonnet |
| 67 | Toyota RAV4 V (`toyota-rav4/mk5`) | 538,105 | claude/sonnet |
| 68 | Volkswagen Passat B7 (`volkswagen-passat/b7`) | 534,735 | claude/sonnet |
| 69 | Hyundai Tucson IV (NX4) (`hyundai-tucson/nx4`) | 534,242 | claude/sonnet |
| 70 | Suzuki Vitara (LY) (`suzuki-vitara/ly`) | 532,652 | claude/sonnet |
| 71 | Volvo XC60 II (`volvo-xc60/mk2`) | 531,888 | claude/sonnet |
| 72 | Ford Kuga II (`ford-kuga/mk2`) | 528,001 | claude/sonnet |
| 73 | MINI Cooper F56 (`mini-cooper/f56`) | 527,404 | claude/sonnet |
| 74 | Renault Kadjar (`renault-kadjar/mk1`) | 525,525 | claude/sonnet |
| 75 | Renault Clio III (`renault-clio/mk3`) | 520,281 | claude/sonnet |
| 76 | Toyota Aygo II (`toyota-aygo/mk2`) | 518,389 | claude/sonnet |
| 77 | Volkswagen Touran II (`volkswagen-touran/mk2`) | 514,303 | claude/sonnet |
| 78 | Toyota Auris II (`toyota-auris/mk2`) | 512,467 | claude/sonnet |
| 79 | Mercedes-Benz GLC (X253) (`mercedes-benz-glc/x253`) | 511,218 | claude/sonnet |
| 80 | Opel Astra J (`opel-astra/j`) | 510,612 | claude/sonnet |
| 81 | BMW 5 Series (F10/F11) (`bmw-5-series/f10`) | 508,972 | claude/sonnet |
| 82 | BMW 3 Series (G20/G21) (`bmw-3-series/g20`) | 505,449 | claude/sonnet |
| 83 | Mercedes-Benz A-Class (W176) (`mercedes-benz-a-class/w176`) | 500,497 | claude/sonnet |
| 84 | Ford C-Max II (`ford-c-max/mk2`) | 497,841 | claude/sonnet |
| 85 | Opel Corsa D (`opel-corsa/d`) | 492,961 | claude/sonnet |
| 86 | Audi Q3 II (F3) (`audi-q3/f3`) | 492,171 | claude/sonnet |
| 87 | Fiat Tipo II (`fiat-tipo/356`) | 490,933 | claude/sonnet |
| 88 | Mercedes-Benz B-Class (W246) (`mercedes-benz-b-class/w246`) | 490,429 | claude/sonnet |
| 89 | Fiat 500L (`fiat-500l/mk1`) | 485,699 | claude/sonnet |
| 90 | Jeep Renegade (`jeep-renegade/mk1`) | 475,495 | claude/sonnet |
| 91 | Citroën C3 Aircross I (`citroen-c3-aircross/mk1`) | 471,700 | claude/sonnet |
| 92 | Ford Kuga III (`ford-kuga/mk3`) | 469,849 | claude/sonnet |
| 93 | Mercedes-Benz E-Class (W213) (`mercedes-benz-e-class/w213`) | 467,515 | claude/sonnet |
| 94 | Hyundai Tucson III (TL) (`hyundai-tucson/tl`) | 464,463 | claude/sonnet |
| 95 | Škoda Kamiq (`skoda-kamiq/mk1`) | 463,429 | claude/sonnet |
| 96 | SEAT Ateca (`seat-ateca/mk1`) | 457,454 | claude/sonnet |
| 97 | Audi A1 I (`audi-a1/8x`) | 455,495 | claude/sonnet |
| 98 | Škoda Superb III (`skoda-superb/mk3`) | 454,085 | claude/sonnet |
| 99 | Kia Picanto III (`kia-picanto/mk3`) | 441,005 | claude/sonnet |
| 100 | Hyundai i30 III (PD) (`hyundai-i30/pd`) | 439,050 | claude/sonnet |
| 101 | Audi A4 (B8) (`audi-a4/b8`) | 436,955 | claude/sonnet |
| 102 | Opel Crossland X (`opel-crossland/mk1`) | 429,882 | claude/sonnet |
| 103 | SEAT Ibiza IV (`seat-ibiza/mk4`) | 428,017 | claude/sonnet |
| 104 | Volkswagen Golf Sportsvan (`volkswagen-golf-sportsvan/sportsvan`) | 426,469 | claude/sonnet |
| 105 | Nissan Juke I (F15) (`nissan-juke/f15`) | 425,774 | claude/sonnet |
| 106 | Kia Ceed III (`kia-ceed/mk3`) | 424,677 | claude/sonnet |
| 107 | Kia Sportage V (NQ5) (`kia-sportage/nq5`) | 422,760 | claude/sonnet |
| 108 | Audi Q2 (GA) (`audi-q2/ga`) | 417,641 | claude/sonnet |
| 109 | Audi A6 (C7) (`audi-a6/c7`) | 416,966 | claude/sonnet |
| 110 | Škoda Kodiaq I (`skoda-kodiaq/mk1`) | 416,033 | claude/sonnet |
| 111 | Hyundai i20 II (`hyundai-i20/mk2`) | 412,331 | claude/sonnet |
| 112 | Kia Stonic (`kia-stonic/mk1`) | 412,120 | claude/sonnet |
| 113 | Peugeot 5008 II (`peugeot-5008/mk2`) | 411,554 | claude/sonnet |
| 114 | Hyundai Kona I (`hyundai-kona/os`) | 407,334 | claude/sonnet |
| 115 | Kia Sportage IV (QL) (`kia-sportage/ql`) | 401,526 | claude/sonnet |
| 116 | BMW 5 Series (G30/G31) (`bmw-5-series/g30`) | 400,275 | claude/sonnet |
| 117 | Audi A3 (8Y) (`audi-a3/8y`) | 395,187 | claude/sonnet |
| 118 | Nissan Qashqai III (J12) (`nissan-qashqai/j12`) | 388,670 | claude/sonnet |
| 119 | Ford EcoSport II (`ford-ecosport/mk2`) | 388,070 | claude/sonnet |
| 120 | BMW X3 (G01) (`bmw-x3/g01`) | 383,036 | claude/sonnet |
| 121 | Nissan Qashqai I (J10) (`nissan-qashqai/j10`) | 380,524 | claude/sonnet |
| 122 | Citroën C4 Picasso II (`citroen-c4-picasso/mk2`) | 376,916 | claude/sonnet |
| 123 | Audi Q3 I (8U) (`audi-q3/8u`) | 374,827 | claude/sonnet |
| 124 | Volkswagen Touran I (`volkswagen-touran/mk1`) | 372,297 | claude/sonnet |
| 125 | smart fortwo III (C453) (`smart-fortwo/c453`) | 369,597 | claude/sonnet |
| 126 | Audi Q5 II (FY) (`audi-q5/fy`) | 369,467 | claude/sonnet |
| 127 | BMW 1 Series (F40) (`bmw-1-series/f40`) | 363,138 | claude/sonnet |
| 128 | Dacia Logan II (`dacia-logan/mk2`) | 362,043 | claude/sonnet |
| 129 | Škoda Fabia II (`skoda-fabia/mk2`) | 361,281 | claude/sonnet |
| 131 | Alfa Romeo Giulietta (940) (`alfa-romeo-giulietta/940`) | 353,536 | claude/sonnet |
| 132 | Renault Twingo II (`renault-twingo/mk2`) | 352,495 | claude/sonnet |
| 133 | Hyundai i10 II (`hyundai-i10/mk2`) | 351,897 | claude/sonnet |
| 134 | Cupra Formentor (`cupra-formentor/mk1`) | 348,472 | claude/sonnet |
| 135 | Volvo V40 II (`volvo-v40/mk2`) | 345,648 | claude/sonnet |
| 136 | Peugeot 3008 I (`peugeot-3008/mk1`) | 339,943 | claude/sonnet |
| 137 | Mercedes-Benz C-Class (W204) (`mercedes-benz-c-class/w204`) | 336,807 | claude/sonnet |
| 138 | Renault Scénic IV (`renault-scenic/mk4`) | 329,250 | claude/sonnet |
| 139 | Jeep Compass II (`jeep-compass/mk2`) | 323,975 | claude/sonnet |
| 140 | Peugeot 108 (`peugeot-108/mk1`) | 323,422 | claude/sonnet |
| 141 | Citroën C5 Aircross I (`citroen-c5-aircross/mk1`) | 321,803 | claude/sonnet |
| 142 | Mitsubishi Space Star II (`mitsubishi-space-star/mk2`) | 320,681 | claude/sonnet |
| 143 | Peugeot 308 III (`peugeot-308/mk3`) | 319,323 | claude/sonnet |
| 144 | Kia Ceed II (`kia-ceed/mk2`) | 316,010 | claude/sonnet |
| 145 | Opel Mokka II (Mokka-e) (`opel-mokka/mk2`) | 313,548 | claude/sonnet |
| 146 | Audi A1 II (`audi-a1/gb`) | 310,032 | claude/sonnet |
| 147 | Škoda Fabia IV (`skoda-fabia/mk4`) | 309,564 | claude/sonnet |
| 148 | Mercedes-Benz GLA (H247) (`mercedes-benz-gla/h247`) | 308,965 | claude/sonnet |
| 149 | Škoda Rapid (`skoda-rapid/mk1`) | 304,882 | claude/sonnet |
| 150 | BMW X1 (U11) (`bmw-x1/u11`) | 297,882 | claude/sonnet |
| 151 | Tesla Model 3 (`tesla-model-3/mk1`) | 297,747 | claude/sonnet |
| 152 | Peugeot 207 (`peugeot-207/mk1`) | 297,659 | claude/sonnet |
| 153 | Citroën C1 II (`citroen-c1/mk2`) | 297,262 | claude/sonnet |
| 154 | Opel Grandland X (`opel-grandland/mk1`) | 297,159 | claude/sonnet |
| 155 | Volvo XC60 I (`volvo-xc60/mk1`) | 292,148 | claude/sonnet |
| 156 | Peugeot 508 I (`peugeot-508/mk1`) | 291,767 | claude/sonnet |
| 157 | Hyundai i30 II (GD) (`hyundai-i30/gd`) | 289,563 | claude/sonnet |
| 158 | Hyundai i10 III (`hyundai-i10/mk3`) | 289,245 | claude/sonnet |
| 159 | Citroën C4 III (`citroen-c4/mk3`) | 288,751 | claude/sonnet |
| 160 | Hyundai i20 III (`hyundai-i20/mk3`) | 288,651 | claude/sonnet |
| 161 | Mercedes-Benz E-Class (W212) (`mercedes-benz-e-class/w212`) | 287,826 | claude/sonnet |
| 162 | Nissan Juke II (F16) (`nissan-juke/f16`) | 287,611 | claude/sonnet |
| 163 | Citroën C4 Cactus (`citroen-c4/cactus`) | 286,579 | claude/sonnet |
| 164 | Toyota Aygo X (`toyota-aygo-x/mk1`) | 284,953 | claude/sonnet |
| 165 | Volkswagen Caddy IV (`volkswagen-caddy/mk4`) | 282,181 | claude/sonnet |
| 166 | Fiat Panda II (`fiat-panda/mk2`) | 281,277 | claude/sonnet |
| 167 | Mercedes-Benz CLA (C118) (`mercedes-benz-cla/c118`) | 278,666 | claude/sonnet |
| 168 | BMW 4 Series (F32) (`bmw-4-series/f32`) | 277,940 | claude/sonnet |
| 169 | Mercedes-Benz V-Class (W447) (`mercedes-benz-v-class/w447`) | 277,272 | claude/sonnet |
| 170 | BMW 2 Series Active Tourer (F45) (`bmw-2-series/f45`) | 274,646 | claude/sonnet |
| 171 | Kia Sportage III (SL) (`kia-sportage/sl`) | 274,446 | claude/sonnet |
| 172 | Audi A6 (C8) (`audi-a6/c8`) | 272,761 | claude/sonnet |
| 173 | Mazda CX-5 II (`mazda-cx-5/mk2`) | 269,776 | claude/sonnet |
| 174 | Dacia Jogger (`dacia-jogger/mk1`) | 269,099 | claude/sonnet |
| 175 | Volkswagen Taigo I (`volkswagen-taigo/mk1`) | 267,921 | claude/sonnet |
| 176 | Nissan Micra IV (`nissan-micra/k13`) | 266,897 | claude/sonnet |
| 177 | Opel Meriva B (`opel-meriva/b`) | 265,855 | claude/sonnet |
| 178 | Škoda Scala (`skoda-scala/nw`) | 259,574 | claude/sonnet |
| 179 | Citroën Berlingo II (`citroen-berlingo/mk2`) | 259,180 | claude/sonnet |
| 180 | Nissan Micra V (`nissan-micra/k14`) | 258,361 | claude/sonnet |
| 181 | Suzuki Swift V (`suzuki-swift/mk5`) | 255,186 | claude/sonnet |
| 182 | Mercedes-Benz GLC (X254) (`mercedes-benz-glc/x254`) | 254,538 | claude/sonnet |
| 183 | Škoda Yeti (`skoda-yeti/mk1`) | 254,420 | claude/sonnet |
| 184 | BMW X5 (G05) (`bmw-x5/g05`) | 253,905 | claude/sonnet |
| 185 | Opel Adam (`opel-adam/mk1`) | 253,719 | claude/sonnet |
| 186 | Mitsubishi ASX I (`mitsubishi-asx/mk1`) | 253,434 | claude/sonnet |
| 187 | Suzuki Ignis III (`suzuki-ignis/mk3`) | 252,237 | claude/sonnet |
| 188 | BMW X3 (F25) (`bmw-x3/f25`) | 251,277 | claude/sonnet |
| 189 | Volkswagen Tiguan III (`volkswagen-tiguan/mk3`) | 251,074 | claude/sonnet |
| 190 | SEAT Leon IV (`seat-leon/mk4`) | 251,021 | claude/sonnet |
| 191 | Toyota RAV4 IV (`toyota-rav4/mk4`) | 247,954 | claude/sonnet |
| 193 | Dacia Lodgy (`dacia-lodgy/mk1`) | 244,311 | claude/sonnet |
| 194 | Opel Insignia A (`opel-insignia/a`) | 244,074 | claude/sonnet |
| 195 | Volkswagen Sharan II (`volkswagen-sharan/mk2`) | 243,432 | claude/sonnet |
| 196 | Kia Rio III (`kia-rio/mk3`) | 243,271 | claude/sonnet |
| 197 | Hyundai ix20 (`hyundai-ix20/mk1`) | 241,334 | claude/sonnet |
| 198 | Volvo V60 I (`volvo-v60/mk1`) | 240,572 | claude/sonnet |
| 199 | Volkswagen ID.4 (`volkswagen-id-4/mk1`) | 238,111 | claude/sonnet |
| 200 | Škoda Citigo (`skoda-citigo/mk1`) | 232,769 | claude/sonnet |
| 201 | Škoda Octavia II (`skoda-octavia/mk2`) | 231,669 | claude/sonnet |
| 202 | Mercedes-Benz GLA (X156) (`mercedes-benz-gla/x156`) | 230,815 | claude/sonnet |
| 203 | Mercedes-Benz C-Class (W206) (`mercedes-benz-c-class/w206`) | 230,668 | claude/sonnet |
| 204 | MINI One (F56) (`mini-one/f56`) | 230,482 | claude/sonnet |
| 205 | Volvo V60 II (`volvo-v60/mk2`) | 229,266 | claude/sonnet |
| 206 | Ford Mondeo V (`ford-mondeo/mk5`) | 228,692 | claude/sonnet |
| 207 | Audi Q5 I (8R) (`audi-q5/8r`) | 228,447 | claude/sonnet |
| 208 | Renault Kangoo II (`renault-kangoo/mk2`) | 227,926 | claude/sonnet |
| 209 | Mercedes-Benz CLA (C117) (`mercedes-benz-cla/c117`) | 226,521 | claude/sonnet |
| 210 | Volvo XC90 II (`volvo-xc90/mk2`) | 225,410 | claude/sonnet |
| 211 | Mercedes-Benz GLE (V167/C167) (`mercedes-benz-gle/v167`) | 225,118 | claude/sonnet |
| 212 | Suzuki Swift IV (`suzuki-swift/mk4`) | 224,625 | claude/sonnet |
| 213 | Renault Arkana I (`renault-arkana/mk1`) | 223,733 | claude/sonnet |
| 214 | Dacia Duster III (`dacia-duster/mk3`) | 223,177 | claude/sonnet |
| 215 | Kia Niro (DE) (`kia-niro/mk1`) | 222,776 | claude/sonnet |
| 216 | Mazda CX-30 (`mazda-cx-30/dm`) | 222,743 | claude/sonnet |
| 217 | Kia Rio IV (`kia-rio/mk4`) | 222,181 | claude/sonnet |
| 218 | smart fortwo II (W451) (`smart-fortwo/w451`) | 221,084 | claude/sonnet |
| 219 | Mazda CX-3 (DJ) (`mazda-cx-3/dj`) | 220,577 | claude/sonnet |
| 220 | Kia Picanto II (`kia-picanto/mk2`) | 216,147 | claude/sonnet |
| 221 | MG ZS I (`mg-zs/mk1`) | 215,471 | claude/sonnet |
| 222 | Hyundai i20 I (`hyundai-i20/mk1`) | 212,925 | claude/sonnet |
| 223 | Fiat 500e / 500 Hybrid (FA1) (`fiat-500/fa1`) | 208,986 | claude/sonnet |
| 224 | Kia XCeed (CD) (`kia-xceed/mk1`) | 207,686 | claude/sonnet |
| 225 | Škoda Enyaq iV (`skoda-enyaq/mk1`) | 205,467 | claude/sonnet |
| 226 | Suzuki SX4 S-Cross (`suzuki-sx4/s-cross`) | 201,882 | claude/sonnet |
| 227 | Volkswagen Golf Plus (`volkswagen-golf-plus/mk1`) | 200,534 | claude/sonnet |
| 228 | Renault Austral (`renault-austral/mk1`) | 200,076 | claude/sonnet |
| 229 | Ford B-Max (`ford-b-max/mk1`) | 199,417 | claude/sonnet |
| 230 | MINI Countryman (F60) (`mini-countryman/f60`) | 198,855 | claude/sonnet |
| 231 | Tesla Model 3 (Highland) (`tesla-model-3/highland`) | 197,472 | claude/sonnet |
| 232 | Mercedes-Benz B-Class (W247) (`mercedes-benz-b-class/w247`) | 195,179 | claude/sonnet |
| 233 | BMW X1 (E84) (`bmw-x1/e84`) | 194,941 | claude/sonnet |
| 234 | Peugeot 5008 I (`peugeot-5008/mk1`) | 193,619 | claude/sonnet |
| 235 | Volkswagen Caddy III (`volkswagen-caddy/mk3`) | 192,845 | claude/sonnet |
| 236 | Audi A5 (F5) (`audi-a5/b9`) | 192,468 | claude/sonnet |
| 237 | Citroën DS3 (`citroen-ds3/mk1`) | 191,448 | claude/sonnet |
| 238 | Jeep Avenger (`jeep-avenger/mk1`) | 190,664 | claude/sonnet |
| 239 | Mitsubishi Outlander III (`mitsubishi-outlander/mk3`) | 189,040 | claude/sonnet |
| 240 | Nissan X-Trail III (T32) (`nissan-x-trail/t32`) | 187,585 | claude/sonnet |
| 241 | Peugeot Partner II (`peugeot-partner/b9`) | 187,436 | claude/sonnet |
| 243 | Citroën C3 IV (`citroen-c3/mk4`) | 186,098 | claude/sonnet |
| 244 | Toyota C-HR II (`toyota-c-hr/mk2`) | 183,497 | claude/sonnet |
| 245 | Ford Ka II (`ford-ka/mk2`) | 183,198 | claude/sonnet |
| 246 | Opel Karl (`opel-karl/mk1`) | 182,327 | claude/sonnet |
| 247 | Mazda 2 Mazda 2 (DJ) (`mazda-2/mk3`) | 181,216 | claude/sonnet |
| 248 | Opel Astra L (`opel-astra/l`) | 180,458 | claude/sonnet |
| 249 | Dacia Spring (`dacia-spring/mk1`) | 180,278 | claude/sonnet |
| 250 | Toyota Avensis III (T27) (`toyota-avensis/mk3`) | 177,907 | claude/sonnet |
| 251 | Citroën Berlingo III (`citroen-berlingo/mk3`) | 177,610 | claude/sonnet |
| 252 | Toyota Aygo I (`toyota-aygo/mk1`) | 177,171 | claude/sonnet |
| 253 | Audi A5 (8T) (`audi-a5/b8`) | 176,922 | claude/sonnet |
| 254 | Mazda CX-5 I (`mazda-cx-5/mk1`) | 175,505 | claude/sonnet |
| 255 | Land Rover Range Rover Evoque I (`land-rover-range-rover-evoque/l538`) | 172,976 | claude/sonnet |
| 256 | SEAT Alhambra II (`seat-alhambra/mk2`) | 172,698 | claude/sonnet |
| 257 | Hyundai Kona II (`hyundai-kona/sx2`) | 171,493 | claude/sonnet |
| 258 | smart forfour II (W453) (`smart-forfour/w453`) | 170,559 | claude/sonnet |
| 259 | Audi A3 (8P) (`audi-a3/8p`) | 169,711 | claude/sonnet |
| 260 | Cupra Leon IV (`cupra-leon/mk4`) | 168,923 | claude/sonnet |
| 262 | Opel Insignia B (`opel-insignia/b`) | 166,945 | claude/sonnet |
| 263 | Citroën C1 I (`citroen-c1/mk1`) | 166,223 | claude/sonnet |
| 264 | MINI Cooper S (F56) (`mini-cooper-s/f56`) | 166,101 | claude/sonnet |
| 265 | BMW X2 (F39) (`bmw-x2/f39`) | 163,480 | claude/sonnet |
| 266 | Peugeot 107 (`peugeot-107/mk1`) | 163,299 | claude/sonnet |
| 267 | Volvo V90 II (`volvo-v90/mk2`) | 162,584 | claude/sonnet |
| 268 | Renault Zoe II (ZE50) (`renault-zoe/mk2`) | 162,452 | claude/sonnet |
| 269 | Kia Niro (SG2) (`kia-niro/mk2`) | 161,206 | claude/sonnet |
| 270 | Porsche Macan (95B) (`porsche-macan/95b`) | 159,972 | claude/sonnet |
| 271 | Volkswagen Caddy V (`volkswagen-caddy/mk5`) | 159,312 | claude/sonnet |
| 272 | Renault Trafic III (`renault-trafic/mk3`) | 158,239 | claude/sonnet |
| 273 | Mazda 3 Mazda3 III (`mazda-3/mk3`) | 157,933 | claude/sonnet |
| 274 | Toyota Verso (AR20) (`toyota-verso/ar20`) | 157,712 | claude/sonnet |
| 275 | Citroën C4 Picasso I (`citroen-c4-picasso/mk1`) | 157,498 | claude/sonnet |
| 276 | DS DS 7 Crossback (`ds-ds-7/mk1`) | 151,787 | claude/sonnet |
| 277 | Mercedes-Benz Vito (W447) (`mercedes-benz-vito/w447`) | 147,335 | claude/sonnet |
| 278 | BMW 3 Series (E90/E91/E92/E93) (`bmw-3-series/e90`) | 146,515 | claude/sonnet |
| 279 | Škoda Superb II (`skoda-superb/mk2`) | 145,620 | claude/sonnet |
| 280 | Mazda 6 Mazda 6 III (`mazda-6/mk3`) | 144,608 | claude/sonnet |
| 281 | Mercedes-Benz GLB (X247) (`mercedes-benz-glb/x247`) | 142,489 | claude/sonnet |
| 282 | Peugeot 3008 III (`peugeot-3008/mk3`) | 142,007 | claude/sonnet |
| 283 | Ford Mondeo IV (`ford-mondeo/mk4`) | 141,389 | claude/sonnet |
| 284 | Nissan Leaf II (`nissan-leaf/ze1`) | 140,461 | claude/sonnet |
| 285 | Dacia Sandero I (`dacia-sandero/mk1`) | 140,023 | claude/sonnet |
| 286 | BMW X5 (F15) (`bmw-x5/f15`) | 139,419 | claude/sonnet |
| 287 | BMW 2 Series Gran Tourer (F46) (`bmw-2-series/f46`) | 137,296 | claude/sonnet |
| 288 | Alfa Romeo Stelvio (`alfa-romeo-stelvio/949`) | 136,463 | claude/sonnet |
| 289 | Peugeot Rifter (`peugeot-rifter/mk1`) | 136,342 | claude/sonnet |
| 290 | Citroën C5 II (X7) (`citroen-c5/x7`) | 135,446 | claude/sonnet |
| 291 | Alfa Romeo MiTo (`alfa-romeo-mito/mk1`) | 134,058 | claude/sonnet |
| 292 | Volkswagen Arteon (`volkswagen-arteon/mk1`) | 130,682 | claude/sonnet |
| 294 | Renault Zoe I (`renault-zoe/mk1`) | 128,575 | claude/sonnet |
| 295 | SEAT Mii (`seat-mii/mk1`) | 127,018 | claude/sonnet |
| 296 | Mazda 3 Mazda3 IV (`mazda-3/mk4`) | 125,033 | claude/sonnet |
| 297 | Hyundai ix35 (`hyundai-ix35/mk1`) | 122,823 | claude/sonnet |
| 298 | Ford S-Max II (`ford-s-max/mk2`) | 122,797 | claude/sonnet |
| 299 | Honda CR-V IV (`honda-cr-v/mk4`) | 122,538 | claude/sonnet |
| 300 | Porsche Cayenne III (E3) (`porsche-cayenne/e3`) | 121,956 | claude/sonnet |
| 301 | Volkswagen Multivan T6 (`volkswagen-multivan/t6`) | 121,707 | claude/sonnet |
| 302 | BMW 2 Series Coupé (F22) (`bmw-2-series/f22`) | 117,351 | claude/sonnet |
| 303 | Land Rover Discovery Sport (L550) (`land-rover-discovery-sport/l550`) | 117,093 | claude/sonnet |
| 304 | Volkswagen Passat B9 (`volkswagen-passat/b9`) | 116,030 | claude/sonnet |
| 305 | Peugeot 206 (`peugeot-206/mk1`) | 115,779 | claude/sonnet |
| 306 | Volvo V70 III (`volvo-v70/p3`) | 115,090 | claude/sonnet |
| 308 | Renault Laguna III (`renault-laguna/x91`) | 114,776 | claude/sonnet |
| 309 | Audi Q7 (4M) (`audi-q7/4m`) | 113,802 | claude/sonnet |
| 310 | Hyundai Bayon (`hyundai-bayon/mk1`) | 113,634 | claude/sonnet |
| 311 | Volkswagen ID.3 (pre-facelift) (`volkswagen-id-3/mk1`) | 113,575 | claude/sonnet |
| 312 | Ford Ka+ (Ka III) (`ford-ka/mk3`) | 113,485 | claude/sonnet |
| 313 | Peugeot 508 II (`peugeot-508/mk2`) | 113,388 | claude/sonnet |
| 314 | Hyundai i10 I (`hyundai-i10/mk1`) | 113,068 | claude/sonnet |
| 315 | Renault Mégane E-Tech Electric (`renault-megane/e-tech`) | 112,094 | claude/sonnet |
| 316 | BMW 3 Series Gran Turismo (F34) (`bmw-3-series/f34`) | 110,942 | claude/sonnet |
| 317 | Renault Talisman (`renault-talisman/mk1`) | 109,934 | claude/sonnet |
| 318 | Ford Tourneo Custom I (`ford-tourneo-custom/mk1`) | 109,823 | claude/sonnet |
| 319 | Chevrolet Spark (M300) (`chevrolet-spark/m300`) | 108,744 | claude/sonnet |
| 320 | BMW X4 (G02) (`bmw-x4/g02`) | 108,239 | claude/sonnet |
| 321 | Honda Civic IX (`honda-civic/mk9`) | 107,543 | claude/sonnet |
| 322 | Hyundai i40 (`hyundai-i40/mk1`) | 107,298 | claude/sonnet |
| 324 | BMW 4 Series (G22) (`bmw-4-series/g22`) | 106,688 | claude/sonnet |
| 325 | Mercedes-Benz EQA (H243) (`mercedes-benz-eqa/h243`) | 106,016 | claude/sonnet |
| 326 | Volkswagen ID.3 (facelift) (`volkswagen-id-3/mk1-facelift`) | 104,014 | claude/sonnet |
| 327 | MG MG4 Electric (`mg-mg4/mk1`) | 102,340 | claude/sonnet |
| 328 | Suzuki Swift VI (`suzuki-swift/mk6`) | 101,338 | claude/sonnet |
| 329 | Mitsubishi Eclipse Cross I (`mitsubishi-eclipse-cross/gk`) | 101,233 | claude/sonnet |
| 330 | Volvo EX30 (`volvo-ex30/mk1`) | 100,951 | claude/sonnet |
| 331 | Mercedes-Benz A-Class (W169) (`mercedes-benz-a-class/w169`) | 100,856 | claude/sonnet |
| 332 | Ford S-Max I (`ford-s-max/mk1`) | 100,562 | claude/sonnet |
| 333 | Fiat Qubo (`fiat-qubo/mk1`) | 99,042 | claude/sonnet |
| 334 | Citroën SpaceTourer C4 SpaceTourer (`citroen-spacetourer/c4-spacetourer`) | 98,549 | claude/sonnet |
| 335 | Land Rover Range Rover Sport II (`land-rover-range-rover-sport/l494`) | 98,398 | claude/sonnet |
| 336 | SEAT Tarraco (`seat-tarraco/mk1`) | 97,601 | claude/sonnet |
| 337 | Porsche 911 (992) (`porsche-911/992`) | 97,568 | claude/sonnet |
| 338 | Volkswagen Touareg II (`volkswagen-touareg/7p`) | 96,046 | claude/sonnet |
| 339 | Volkswagen Touareg III (`volkswagen-touareg/cr`) | 95,371 | claude/sonnet |
| 340 | Nissan Note II (`nissan-note/mk2`) | 93,726 | claude/sonnet |
| 341 | BMW 2 Series Active Tourer (U06) (`bmw-2-series/u06`) | 91,792 | claude/sonnet |
| 342 | Škoda Roomster (`skoda-roomster/mk1`) | 91,361 | claude/sonnet |
| 343 | BMW i4 (G26) (`bmw-i4/g26`) | 90,400 | claude/sonnet |
| 344 | Hyundai Ioniq 5 (`hyundai-ioniq-5/mk1`) | 90,257 | claude/sonnet |
| 345 | Honda HR-V II (`honda-hr-v/mk2`) | 90,116 | claude/sonnet |
| 346 | Land Rover Range Rover Evoque II (`land-rover-range-rover-evoque/l551`) | 89,875 | claude/sonnet |
| 348 | Audi Q8 (4M) (`audi-q8/4m`) | 88,213 | claude/sonnet |
| 349 | Volkswagen Multivan T7 (`volkswagen-multivan/t7`) | 87,815 | claude/sonnet |
| 350 | Renault Espace V (`renault-espace/mk5`) | 87,458 | claude/sonnet |
| 351 | Kia EV6 (`kia-ev6/mk1`) | 86,525 | claude/sonnet |
| 352 | Suzuki SX4 S-Cross II (`suzuki-sx4/s-cross-ii`) | 85,465 | claude/sonnet |
| 354 | BMW 1 Series (F70) (`bmw-1-series/f70`) | 83,354 | claude/sonnet |
| 355 | Mercedes-Benz GLE (W166) (`mercedes-benz-gle/w166`) | 82,445 | claude/sonnet |
| 356 | Dacia Logan III (`dacia-logan/mk3`) | 82,321 | claude/sonnet |
| 357 | Toyota Auris I (`toyota-auris/mk1`) | 81,060 | claude/sonnet |
| 358 | Mercedes-Benz EQB (X243) (`mercedes-benz-eqb/x243`) | 80,684 | claude/sonnet |
| 359 | Ford Kuga I (`ford-kuga/mk1`) | 80,392 | claude/sonnet |
| 360 | Honda Civic X (`honda-civic/mk10`) | 78,803 | claude/sonnet |
| 361 | Dacia Logan I (`dacia-logan/mk1`) | 78,653 | claude/sonnet |
| 362 | Lexus NX I (AZ10) (`lexus-nx/az10`) | 78,553 | claude/sonnet |
| 363 | Volkswagen Multivan T5 (`volkswagen-multivan/t5`) | 77,951 | claude/sonnet |
| 364 | Kia ProCeed III (CD) (`kia-proceed/cd`) | 77,823 | claude/sonnet |
| 365 | Alfa Romeo Tonale (`alfa-romeo-tonale/mk1`) | 77,533 | claude/sonnet |
| 366 | Mercedes-Benz GLK (X204) (`mercedes-benz-glk/x204`) | 77,427 | claude/sonnet |
| 367 | Lexus UX (`lexus-ux/mk1`) | 77,367 | claude/sonnet |
| 385 | Toyota Yaris II (`toyota-yaris/mk2`) | 69,227 | claude/sonnet |
| 386 | Škoda Superb IV (`skoda-superb/mk4`) | 69,150 | claude/sonnet |
| 483 | Kia Ceed I (`kia-ceed/mk1`) | 40,182 | claude/sonnet |
| 488 | Ford Focus II (`ford-focus/mk2`) | 38,166 | claude/sonnet |
| 588 | Opel Astra H (`opel-astra/h`) | 20,696 | claude/sonnet |
| 615 | Toyota Yaris GR Yaris (`toyota-yaris/gr-yaris`) | 16,901 | claude/sonnet |
| 663 | Volkswagen Passat CC (`volkswagen-passat/cc`) | 8,310 | claude/sonnet |
| 709 | Renault Clio VI (`renault-clio/mk6`) | 3,320 | claude/sonnet |
| 758 | Škoda Octavia I (`skoda-octavia/mk1`) | 456 | claude/sonnet |
| 760 | Mitsubishi Lancer Evolution X (`mitsubishi-lancer/evo-x`) | 417 | opencode/opencode-go/kimi-k2.7-code |
| 762 | Ford C-Max I (`ford-c-max/mk1`) | 399 | opencode/opencode-go/kimi-k2.7-code |
| 765 | Audi e-tron A6 e-tron (`audi-e-tron/gh`) | 366 | opencode/opencode-go/kimi-k2.7-code |
| 766 | Jeep Compass III (`jeep-compass/mk3`) | 362 | opencode/opencode-go/kimi-k2.7-code |
| 769 | MINI Cabrio (F57) (`mini-cabrio/f57`) | 303 | opencode/opencode-go/minimax-m3 |
| 770 | BMW M5 Touring (G99) (`bmw-m5/g99`) | 270 | opencode/opencode-go/minimax-m3 |
| 772 | Subaru Impreza VI (`subaru-impreza/gu`) | 225 | opencode/opencode-go/minimax-m3 |
| 773 | Suzuki S-Cross SX4 S-Cross (`suzuki-s-cross/mk1`) | 222 | opencode/opencode-go/minimax-m3 |
| 774 | Volkswagen Jetta V (`volkswagen-jetta/mk5`) | 198 | opencode/opencode-go/minimax-m3 |
| 775 | Mitsubishi Eclipse Cross II (`mitsubishi-eclipse-cross/mk2`) | 175 | opencode/opencode-go/minimax-m3 |
| 776 | BMW i3 (NA0) (`bmw-i3/na0`) | 171 | opencode/opencode-go/minimax-m3 |
| 777 | Volkswagen Jetta VII (`volkswagen-jetta/mk7`) | 169 | opencode/opencode-go/minimax-m3 |
| 778 | Opel Meriva A (`opel-meriva/a`) | 167 | opencode/opencode-go/minimax-m3 |
| 779 | MINI Cabrio (U25) (`mini-cabrio/u25`) | 165 | opencode/opencode-go/minimax-m3 |
| 780 | Mazda 5 Mazda5 I (CR) (`mazda-5/mk1`) | 164 | opencode/opencode-go/minimax-m3 |
| 781 | Kia Carens III (`kia-carens/mk3`) | 124 | opencode/opencode-go/minimax-m3 |
| 782 | Chevrolet Corvette C6 (`chevrolet-corvette/c6`) | 120 | opencode/opencode-go/minimax-m3 |
| 783 | Land Rover Defender (Classic) (`land-rover-defender/l316`) | 120 | opencode/opencode-go/minimax-m3 |
| 784 | Renault Master II (`renault-master/mk2`) | 104 | opencode/opencode-go/minimax-m3 |
| 785 | Mercedes-Benz GLB with EQ Technology (H247) (`mercedes-benz-glb/h247`) | 94 | opencode/opencode-go/minimax-m3 |
| 786 | Toyota Land Cruiser 70 (`toyota-land-cruiser/j70`) | 59 | opencode/opencode-go/minimax-m3 |
| 787 | BMW 1 Series Sedan (F52) (`bmw-1-series/f52`) | 51 | opencode/opencode-go/minimax-m3 |
| 788 | Mercedes-Benz CLS (W219) (`mercedes-benz-cls/w219`) | 51 | opencode/opencode-go/minimax-m3 |
| 789 | Ford Fiesta VI (`ford-fiesta/mk6`) | 46 | opencode/opencode-go/minimax-m3 |
| 790 | Škoda Fabia I (`skoda-fabia/mk1`) | 46 | claude/sonnet |
| 792 | Kia Sorento I (JC) (`kia-sorento/jc`) | 39 | opencode/opencode-go/minimax-m3 |
| 793 | Jeep Grand Cherokee III (WH) (`jeep-grand-cherokee/wh`) | 31 | opencode/opencode-go/kimi-k2.7-code |
| 794 | Nissan Navara (NP300, D23) (`nissan-navara/d23`) | 28 | opencode/opencode-go/minimax-m3 |
| 795 | Mitsubishi L200 IV (`mitsubishi-l200/mk4`) | 27 | opencode/opencode-go/minimax-m3 |
| 796 | Renault Grand Scénic III (`renault-grand-scenic/mk3`) | 22 | opencode/opencode-go/minimax-m3 |
| 797 | Alfa Romeo 156 (`alfa-romeo-156/932`) | 0 | opencode/opencode-go/minimax-m3 |
| 798 | Audi A2 (`audi-a2/a2`) | 0 | opencode/opencode-go/minimax-m3 |
| 799 | Fiat Grande Punto (`fiat-grande-punto/199`) | 0 | opencode/opencode-go/minimax-m3 |
| 800 | Fiat Stilo (`fiat-stilo/mk1`) | 0 | opencode/opencode-go/minimax-m3 |
| 801 | Ford Ranger I (`ford-ranger/mk1`) | 0 | opencode/opencode-go/minimax-m3 |
| 802 | Ford Ranger II (`ford-ranger/mk2`) | 0 | opencode/opencode-go/minimax-m3 |
| 803 | Ford Ranger III (`ford-ranger/t6`) | 0 | opencode/opencode-go/minimax-m3 |
| 804 | Ford Ranger IV (`ford-ranger/p703`) | 0 | opencode/opencode-go/minimax-m3 |
| 805 | Hyundai Getz (`hyundai-getz/mk1`) | 0 | opencode/opencode-go/minimax-m3 |
| 806 | MINI Paceman (`mini-paceman/r61`) | 0 | opencode/opencode-go/minimax-m3 |
| 807 | Opel Vectra A (`opel-vectra/a`) | 0 | opencode/opencode-go/minimax-m3 |
| 808 | Opel Vectra B (`opel-vectra/b`) | 0 | opencode/opencode-go/minimax-m3 |
| 809 | Opel Vectra C (`opel-vectra/c`) | 0 | opencode/opencode-go/minimax-m3 |
| 810 | Peugeot 306 (`peugeot-306/mk1`) | 0 | opencode/opencode-go/minimax-m3 |
| 812 | Toyota Hilux V (`toyota-hilux/mk5`) | 0 | opencode/opencode-go/minimax-m3 |
| 813 | Toyota Hilux VI (`toyota-hilux/mk6`) | 0 | opencode/opencode-go/minimax-m3 |
| 814 | Toyota Hilux VII (`toyota-hilux/an10`) | 0 | opencode/opencode-go/minimax-m3 |
| 815 | Toyota Hilux VIII (`toyota-hilux/an120`) | 0 | opencode/opencode-go/minimax-m3 |
| 816 | Toyota Hilux IX (`toyota-hilux/an160`) | 0 | opencode/opencode-go/minimax-m3 |
| 818 | Volkswagen Amarok II (`volkswagen-amarok/mk2`) | 0 | opencode/opencode-go/minimax-m3 |
