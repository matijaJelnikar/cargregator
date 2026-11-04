# Missing engine assessments: evidence and drafts

Research date: 2026-11-02. The five public engine rows still have empty assessment fields. No source reports or database rows were edited.

## What the sources establish

| Generation and stored name | Public row identity | Findings |
| --- | --- | --- |
| Fabia IV, `1.5 TSI` | 110 kW, 1498 cc, petrol, `EA211 evo` | A real production option, with seven-speed DSG. The omitted report entry needs a new assessment. |
| Superb IV, `1.5 TSI` | 110 kW, 1498 cc, petrol, `EA211` | The manufacturer describes this generation's 110 kW 1.5 TSI as a mild hybrid. The separate stored `1.5 TSI mild hybrid` assessment must not be copied merely because the names resemble each other; fuel/registration classification needs review. |
| Qashqai J12, `1.3 DIG-T` | 103/116 kW, 1332 cc, petrol, `H5Ht` | Nissan's European J12 launch describes the 140/158 PS 1.3 as a 12 V mild hybrid. The existing assessed `1.3 DIG-T Mild Hybrid` name does not automatically establish whether the two petrol-labelled rows are aliases or distinct registration groups. |
| Megane IV, `1.0 TCe` | 84 kW, 999 cc, petrol, code null | This engine exists: Renault's facelift manual identifies `1.0 TCe` as `H5D Turbo`, 999 cc. Renault Romania confirms a 1.0 TCe in the facelift Sedan range. Do not confuse it with the older 1.2 TCe. |

The public snapshot is retained in `data-raw/carinfo/assessment-supplements/snapshot-20261102.json`. Its rows include exact IDs, dates, status and timestamps for future guarded SQL. Technical specifications establish identity; they do not establish a reliability score or a recommendation.

## Sources

1. [Škoda Fabia EVO engine announcement, 12 August 2021](https://www.skoda.co.uk/news/details/efficient-evo-engines-increase-fabia-range): 1.5 TSI, 110 kW, DSG and cylinder deactivation.
2. [Škoda Superb launch, 29 May 2024](https://www.skoda-storyboard.com/en/skoda-superb-driving-experience-press-kit-2/the-all-new-skoda-superb-more-space-more-comfort-more-efficiency-and-more-safety/): confirms the mild-hybrid 1.5 TSI in the fourth generation.
3. [Škoda Superb powertrain press kit, 11 March 2024](https://cdn.skoda-storyboard.com/2024/03/04_Press_Kit_Skoda_Superb_Combi_ML_Powertrains_39eafbe8.pdf): 48 V starter-generator system and DSG; distinguishes the plug-in hybrid.
4. [Nissan Qashqai powertrain announcement, 15 January 2021](https://uk.nissannews.com/en-GB/releases/new-nissan-qashqai-electrified-powertrains-accelerate-europes-best-selling-crossover-into-the-future): 140/158 PS 1.3 with 12 V assistance, manual or Xtronic depending on version.
5. [Renault Megane 4 phase 2 manual, engine specifications](https://www.user-manual.renault.com/en/section-6-technical-specifications/engine-specifications-12): H5D Turbo and 999 cc for 1.0 TCe; H5H and 1333 cc for 1.3 TCe.
6. [Renault Romania, facelift Megane Sedan launch](https://www.renault.ro/noutati/noul-megane-sedan-disponibil-in-romania.html): confirms the 1.0 TCe offering. This establishes availability in that market, not availability in every European market.

## Conservative summary drafts

These are factual drafts for a future checked supplement, not loaded assessments. No unsupported failure claim, annual repair budget, recommendation or numeric reliability score has been supplied.

### Fabia IV 1.5 TSI

**SL:** Štirivaljni 1.5 TSI s 110 kW je najmočnejša začetna motorna možnost Fabie IV in je povezan s sedemstopenjskim DSG. Ima izklapljanje valjev pri manjši obremenitvi. Pred nakupom preverite servisno zgodovino; navedeni tehnični vir ne dokazuje dolgoročne zanesljivosti.

**EN:** The 110 kW four-cylinder 1.5 TSI was the most powerful engine in the Fabia IV launch range and comes with a seven-speed DSG. It deactivates cylinders under light load. Check the service history before buying; the cited technical source does not establish long-term reliability.

### Superb IV 1.5 TSI

**SL:** Škodin tehnični opis za Superb IV navaja 1.5 TSI s 110 kW kot blagi hibrid z 48-voltnim sistemom in sedemstopenjskim DSG. To ni priključni hibrid iV. Pri vozilu, ki je v podatkih označeno zgolj kot bencinsko, je treba pred pripisom ocene potrditi pogonsko različico.

**EN:** Škoda describes the Superb IV's 110 kW 1.5 TSI as a 48 V mild hybrid with a seven-speed DSG. It is distinct from the iV plug-in hybrid. Confirm the powertrain identity before assigning the assessment to a row classified only as petrol.

### Qashqai J12 1.3 DIG-T

**SL:** Nissan za evropski Qashqai J12 navaja 1.3 DIG-T s 140 ali 158 KM in 12-voltnim blagim hibridnim sistemom. Menjalnik in pogon se razlikujeta glede na različico. Pred pripisom ocene bencinsko označenima vrsticama preverite, ali opisujeta isto blago hibridno izvedbo.

**EN:** Nissan's European Qashqai J12 launch specifies a 140 or 158 PS 1.3 DIG-T with a 12 V mild-hybrid system. Transmission and driven wheels depend on the variant. Verify whether the petrol-labelled catalogue rows represent this same powertrain before assigning an assessment.

### Megane IV 1.0 TCe

**SL:** Renaultov priročnik za prenovljeni Megane IV navaja 999-kubični 1.0 TCe z oznako H5D Turbo. Na voljo je bil tudi v prenovljeni limuzini na romunskem trgu. Ne gre za starejši 1.2 TCe; tehnična dokumentacija sama ne zadošča za oceno zanesljivosti ali stroškov popravil.

**EN:** Renault's facelift Megane IV manual identifies the 999 cc 1.0 TCe as H5D Turbo. It was also offered in the facelift Sedan in Romania. It is distinct from the older 1.2 TCe; technical documentation alone is insufficient to establish reliability or repair costs.

## Remaining decision

The current report contract requires a verdict and a 1–10 score for each engine assessment. Decide whether source-backed factual summaries may be published without those ratings, or keep these five rows unassessed until a checked reliability assessment is available. Superb and Qashqai also need identity adjudication before an existing hybrid assessment can be reused. Questions are recorded in `docs/QUESTIONS-FOR-MATIJA.md`.
