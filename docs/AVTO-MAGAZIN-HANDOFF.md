# Resume after session reset

User wants to continue this work after resetting Codex so the newly configured Supabase MCP tools become available.

## Requested outcome

1. Remove this unnecessary notice wherever it appears: `Poročilo je pripravljeno s pomočjo umetne inteligence; vsako težavo smo preverili v virih, človek pa ga še ni pregledal.` Remove the English equivalent too.
2. Fix Avto Magazin links across cars: many point to model index pages instead of real road-test articles. User example:
   - Wrong: https://avto-magazin.metropolitan.si/avtomobili/audi/a6-allroad/
   - Correct article: https://avto-magazin.metropolitan.si/avtomobilski-testi/test-audi-a6-allroad-30-tdi-180-kw-quattro-s-tronic/
3. Read existing URLs and generation context from Supabase, verify relevant replacement articles, and prepare a SQL correction script. USER WILL EXECUTE SQL. Do not execute database mutations.

## Supabase

Project ref: wblmhgmotllxffpwsmhb. MCP server `supabase` is configured with read_only=true. `codex mcp list` confirmed enabled, but the current conversation had no Supabase tools. Rediscover tools after reset; do not reinstall the server.

Schema is `carinfo`. Tables: `links` (id, generation_id, kind, label, url), `generations` (id, model_id, name, code, year_from, year_to, ...). Links have unique(generation_id,url). Read migrations in supabase/migrations for details before preparing updates.

Prepared read-only query: data-raw/carinfo/sql/audit-avto-magazin-links.sql. It has NOT been run against Supabase. No live data has been read, no SQL correction script produced yet.

## Edits already made, unfinished and untested

- src/components/CarReport.tsx: removed aiChecked tooltip from unreviewed report badge (AI summary badge remains).
- src/components/ModelBuyingGuide.tsx: sources section review paragraph now shown only for human-reviewed reports.
- src/app/[lang]/dictionaries/{en,sl}.json: removed aiChecked key; preserve unrelated existing changes in these files.
- src/lib/avtoMagazin.ts: new URL predicate accepting direct /avtomobilski-testi/<slug>/ URLs only; HTML extractor takes unique article hrefs after h1. Needs review against actual source HTML; avoid unrelated article links in sidebars/footer.
- src/lib/carLinks.ts: exact Avto Magazin links now require predicate, otherwise existing search fallback.
- scripts/carinfo/link-map.ts: generator now extracts and verifies articles from indexes, times out fetches and throws on unresolved network failures rather than silently overwriting the map. Still selects first article per model, so assess generation relevance; do not attach a 2012 test to unrelated generations.
- scripts/carinfo/report.ts: starting-point prompt now describes saved AM URL as a road test and asks to check generation.
- src/lib/avtoMagazin.test.ts: new tests include all stored map links being articles and supplied Allroad URL. THESE CURRENTLY FAIL because data map has not been updated.
- src/lib/carinfo.test.ts: existing Golf test still expects model index; update when map is corrected.
- src/data/carLinks.json: NOT UPDATED. Contains 312 AM index links. UI generic links are sourced here, so SQL alone will not fix these.

A web-tool batch investigation verified about 67 articles before the user stopped the task. Results existed only in a running functions.exec cell and were lost when it was terminated; do not assume retained results or persisted data. Shell networking failed DNS. Web tool could open indexes and follow article links successfully. Prefer live Supabase links to reuse existing generation-specific article URLs before broad crawling.

## Next steps

1. Read repository AGENTS.md and relevant Next docs as required; discover Supabase MCP tools.
2. Run read-only audit on live links and inspect generation context. Check whether existing real articles can populate static link map.
3. Verify replacement articles and generation relevance. Prepare reviewable, transactional, idempotent SQL with exact old URL/row guards and conflict handling for unique(generation_id,url). Do not execute updates.
4. Finish static carLinks data and generator/UI changes; update outdated tests; run appropriate vitest, TypeScript and lint checks. No validation has yet run.
5. Report notice removal, link coverage and any unresolved items honestly; provide SQL file for user execution.

## Preserve unrelated work

Working tree already contained user/earlier work in scripts/carinfo/knowledge.ts, skeleton.ts, src/app/[lang]/avti/[make]/[model]/[gen]/[engine]/page.tsx, dictionaries, src/lib/carinfoDb.ts, and untracked engine-code audit/repair/test files and relatedEngines.test.ts. Do not revert or overwrite these changes.

No commits or deployment made. No qualifying Next.js feedback issue encountered so far; AGENTS.md asks for feedback reporting pass only if candidates exist.

## Latest user correction — takes precedence

User needs ONLY SQL files for URL corrections. Removed our helper module/test and restored our changes to link-map.ts, report.ts and carLinks.ts. Do not create generator/helper scripts or change URL application code. Keep the originally requested notice removal. Existing audit SQL remains. Prepare SQL corrections for user execution after inspecting live Supabase. Earlier implementation next steps above are superseded by this SQL-only scope.

## November 2 continuation — user approved button-code changes

The user extended the scope to fix the source buttons after learning SQL cannot
change their hardcoded Google URLs. Read-only Supabase inspection found 3,836
links, zero stored Google search links, 287 Euro NCAP links, and 299 of 818
generations with ncap_url. The supplied A6 Allroad C7 article is already stored
correctly. Only one stored AM link is an /avtomobili/ index, a Defender brand
history reference; do not replace it blindly with a road test.

carLinks.ts now reads links and ncap_url from the generation already passed by
the model guide, engine page and car check panel. It prefers direct AM road-test
articles, official NCAP result/assessment pages (ncap_url first), and TÜV-related
report sources. Static AM indexes become searches; model-level cards without a
selected generation still use searches rather than borrowing another generation's
article. Compact source buttons distinguish searches with a search icon.

Added read-only data-raw/carinfo/sql/audit-source-buttons.sql. No database mutations
were performed; the button issue requires no SQL correction. Direct-link selection
does not verify external page availability or the accuracy of existing report data.
Targeted carinfo tests (21) and TypeScript passed.

### Allroad C8 follow-up

The user found C8 still opened a TÜV Google search. Live read-only inspection
confirmed it has no stored ADAC/TÜV sources. ADAC selection also still ignored
generation report links; fixed that omission. Added verified C8-only ADAC/TÜV
fallback URLs under audi-a6-allroad.generations[2019] in carLinks.json, plus the
ADAC A6 model-family catalog for model-level links. Other generations do not
inherit C8 sources. ADAC C8 URL is specifically a 50 TDI (2020–2023) variant;
AUTO BILD TÜV URL covers the broader A6/A7 model family.

Prepared data-raw/carinfo/sql/fix-a6-allroad-c8-sources.sql for user execution;
it guards the exact live generation and inserts without overwriting existing
links or duplicates. Not executed. The static fallbacks work without SQL import.
No deployment performed. Targeted tests now include the reported C8 case.

### Header test shortcut and audience

User requested a direct Avto Magazin test shortcut near the generation heading
and on engine pages. It must appear for visitors located in Slovenia even when
English is selected, but not for visitors in Germany. CarTestButton.tsx now gates
the shortcut on /api/visitor-country/, using Cloudflare's CF-IPCountry header.
The endpoint is dynamic with private/no-store responses; cached car pages stay
independent of visitor location. Unknown location and failed requests hide the
shortcut. No browser geolocation prompt or language-based location guess.
The original reference/source links remain available in the sources section.
Local development has no Cloudflare country header by default, so the shortcut
is hidden there unless the endpoint receives CF-IPCountry: SI. No deployment.
