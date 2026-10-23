// Generation photos: finds a free-licensed photo on Wikipedia/Wikimedia Commons, resizes it to WebP, uploads it to
// Cloudflare R2 and writes the SQL that points carinfo.generations at it. Photos never go into the repo or Supabase.
// Every step is resumable: it skips work whose output already exists.
//
//   node scripts/carinfo/images.ts fetch [modelIds...]   # → data-raw/carinfo/images/{manifest.json,*.webp,report.md}
//   node scripts/carinfo/images.ts recheck [--none] [genIds...]  # drop rejected/duplicate/hand-picked photos (and
//                                                        # with --none the misses), search again
//   node scripts/carinfo/images.ts upload                # wrangler r2 object put (needs `npx wrangler login`)
//   IMG_BASE=https://img.example.com node scripts/carinfo/images.ts sql   # → data-raw/carinfo/sql/images-NNN.sql
//
// report.md lists where each photo came from, so a wrong pick is fixed by deleting its manifest entry and rerunning.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { MAKES } from "../../src/data/makes.ts";
import { sqlString as q } from "./sql.ts";

const DIR = "data-raw/carinfo/images";
const MANIFEST = `${DIR}/manifest.json`;
/** Photos rejected by hand (recheck with generation ids), never picked again for that generation. */
const REJECTED = `${DIR}/rejected.json`;
const SQL_DIR = "data-raw/carinfo/sql";
const BUCKET = "cargregator-img";
const REST = "https://wblmhgmotllxffpwsmhb.supabase.co/rest/v1";
const KEY = "sb_publishable_f3QEE0kxL0E7HqB2CWMRTg_-Dc-aOb4";
// Wikimedia asks API clients to identify themselves.
const UA = "cargregator-carinfo/1.0 (https://cars.jelnikar.dev)";
const WIDTH = 960;
const FREE = /^(cc[ -]?by(-sa)?[ -]?\d|cc0|public domain|pd)/i;

interface Gen {
  id: string;
  model_id: string;
  name: string;
  code: string | null;
  year_from: number;
  year_to: number | null;
}

interface Entry {
  status: "ok" | "none";
  article?: string;
  file?: string;
  credit?: string;
  license?: string;
  source_url?: string;
  uploaded?: boolean;
  note?: string;
}

type Manifest = Record<string, Entry>;

const loadManifest = async (): Promise<Manifest> => (existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {});
const saveManifest = (m: Manifest) => writeFile(MANIFEST, JSON.stringify(m, null, 1) + "\n");

async function json<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
}

const wiki = (params: Record<string, string>) =>
  `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params })}`;

/** Strips Commons' HTML from the Artist field: `<a href="…">Jane Doe</a>` → "Jane Doe". */
const plain = (html: string | undefined) =>
  (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

async function searchArticles(query: string): Promise<string[]> {
  const r = await json<{ query?: { search: { title: string }[] } }>(wiki({ action: "query", list: "search", srsearch: query, srlimit: "3" }));
  return r.query?.search.map((s) => s.title) ?? [];
}

/** Lead image of an article, with the title it resolves to after redirects ("Touareg (7P)" → "Touareg"). */
async function leadImage(title: string): Promise<{ file?: string; title: string }> {
  const r = await json<{ query?: { pages: { title: string; pageimage?: string }[] } }>(
    wiki({ action: "query", prop: "pageimages", piprop: "name", titles: title, redirects: "1" }),
  );
  const page = r.query?.pages[0];
  return { file: page?.pageimage, title: page?.title ?? title };
}

interface ImageInfo {
  thumburl: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string } | undefined>;
}

async function imageInfo(file: string): Promise<ImageInfo | undefined> {
  const r = await json<{ query?: { pages: { imageinfo?: ImageInfo[] }[] } }>(
    `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: String(WIDTH),
      titles: `File:${file}`,
    })}`,
  );
  return r.query?.pages[0]?.imageinfo?.[0];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

/** Words that tie a title to this generation: its code, "mk7" for "Golf VII", chassis codes in the name, its years. */
function markers(gen: Gen, modelName: string): string[] {
  const words = norm(gen.name).replace(norm(modelName), " ").split(/[^a-z0-9]+/).filter((w) => w.length > 1 || /\d/.test(w));
  const roman = words.map((w) => ROMAN[w]).find(Boolean);
  const to = gen.year_to ?? new Date().getFullYear();
  const years = Array.from({ length: Math.min(to - gen.year_from + 1, 4) }, (_, i) => String(gen.year_from + i));
  return [...(gen.code ? [norm(gen.code)] : []), ...(roman ? [`mk${roman}`, `mk ${roman}`] : []), ...words.filter((w) => !ROMAN[w]), ...years];
}

/** File names of detail shots (interior, badge, wheel, engine bay) rather than the whole car. */
const DETAIL =
  /interior|innen|cockpit|dashboard|armaturen|engine|motorraum|badge|emblem|logo|schriftzug|lettering|wheel|felge|\brim\b|heck|rear|seats|sitze?\b|boot|trunk|kofferraum|detail|shifter|gear ?(lever|knob|stick)|steering|lenkrad|tail ?light|nameplate|\bkey\b|screen|display|\brally|\bwrc\b|super 2000|s2000/i;

/** A year in the file name must fall within the generation ("1965 Alfa Romeo Giulia" is not the 2016 Giulia). */
function yearsFit(file: string, gen: Gen): boolean {
  const years = (file.match(/(?<!\d)(19[5-9]\d|20[0-3]\d)(?!\d)/g) ?? []).map(Number);
  const to = (gen.year_to ?? new Date().getFullYear()) + 1;
  return !years.length || years.some((y) => y >= gen.year_from - 1 && y <= to);
}

/** The make must appear in the file name: "Citroën Jumpy" is not a Toyota Proace even though they are twins. */
const MAKE_WORDS: Record<string, string[]> = { "mercedes-benz": ["mercedes", "benz"], volkswagen: ["volkswagen", "vw"], "land-rover": ["land rover", "land-rover", "landrover", "range rover", "range-rover"], "alfa-romeo": ["alfa"] };
function namesMake(file: string, modelId: string): boolean {
  const makeId = MAKES.find((m) => modelId.startsWith(`${m.id}-`))?.id ?? "";
  const words = MAKE_WORDS[makeId] ?? [makeId];
  const f = norm(file).replace(/[_]/g, " ");
  return words.some((w) => f.includes(w));
}

const usable = (file: string, gen: Gen) =>
  !/\.(svg|gif|tiff?)$/i.test(file) && !DETAIL.test(file) && yearsFit(file, gen) && namesMake(file, gen.model_id);

async function save(gen: Gen, file: string, article: string, exclude: Set<string>): Promise<Entry | undefined> {
  if (!usable(file, gen) || exclude.has(file)) return undefined;
  const info = await imageInfo(file);
  const meta = info?.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? "";
  if (!info || !FREE.test(license)) return undefined;
  const res = await fetch(info.thumburl, { headers: { "User-Agent": UA } });
  if (!res.ok) return undefined;
  await sharp(Buffer.from(await res.arrayBuffer()))
    .resize({ width: WIDTH, height: Math.round(WIDTH / 1.6), fit: "cover" })
    .webp({ quality: 78 })
    .toFile(`${DIR}/${gen.id}.webp`);
  return { status: "ok", article, file, credit: plain(meta.Artist?.value) || "Wikimedia Commons", license, source_url: info.descriptionurl };
}

const unique = (xs: string[]) => [...new Set(xs.map((x) => x.replace(/\s+/g, " ").trim()))];

async function commonsFiles(query: string): Promise<string[]> {
  const r = await json<{ query?: { search: { title: string }[] } }>(
    `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ action: "query", format: "json", formatversion: "2", list: "search", srnamespace: "6", srsearch: query, srlimit: "10" })}`,
  );
  return r.query?.search.map((x) => x.title.replace(/^File:/, "")) ?? [];
}

/**
 * 1. the generation's own Wikipedia article ("BMW 3 Series (E90)", "Volkswagen Golf Mk7"), 2. for the newest
 * generation only, the model article (its lead photo shows the current car), 3. a Commons photo whose file name
 * names the model and one of the generation's codes or years.
 */
async function findPhoto(makeName: string, modelName: string, gen: Gen, newest: boolean, exclude: Set<string>): Promise<Entry> {
  const base = norm(`${makeName} ${modelName}`);
  const model = norm(modelName);
  const marks = markers(gen, modelName);
  const tied = (title: string) => marks.some((m) => norm(title).includes(m));

  const roman = marks.find((m) => /^mk\d+$/.test(m));
  const guesses = [
    ...(roman ? [`${makeName} ${modelName} Mk${roman.slice(2)}`] : []),
    ...(gen.code ? [`${makeName} ${modelName} (${gen.code})`] : []),
  ];
  for (const article of [...guesses, ...(await searchArticles(`${makeName} ${gen.name} ${gen.code ?? ""}`))]) {
    const t = norm(article);
    if (!t.includes(model) || t === base || !tied(article)) continue;
    const lead = await leadImage(article);
    if (norm(lead.title) === base) continue; // redirected to the model article, whose photo is the current car
    const hit = lead.file && (await save(gen, lead.file, lead.title, exclude));
    if (hit) return hit;
  }
  if (newest) {
    const lead = await leadImage(`${makeName} ${modelName}`);
    const hit = lead.file && (await save(gen, lead.file, lead.title, exclude));
    if (hit) return hit;
  }
  const queries = unique([
    `${makeName} ${modelName} ${gen.code ?? ""} ${gen.year_from + 1} front`,
    `${gen.year_from + 1} ${makeName} ${gen.name}`,
    `${makeName} ${gen.name} ${gen.code ?? ""}`,
  ]);
  const tried = new Set<string>();
  for (const query of queries) {
    for (const file of await commonsFiles(query)) {
      if (tried.has(file)) continue;
      tried.add(file);
      if (!/\.(jpe?g|png|webp)$/i.test(file) || !norm(file).includes(model) || !tied(norm(file).replace(model, ""))) continue;
      const hit = await save(gen, file, `Commons: ${file}`, exclude);
      if (hit) return hit;
    }
  }
  return { status: "none", note: `no free photo for ${makeName} ${gen.name}` };
}

async function fetchStep(modelIds: string[]) {
  await mkdir(DIR, { recursive: true });
  const filter = modelIds.length ? `&model_id=in.(${modelIds.map(encodeURIComponent).join(",")})` : "";
  const res = await fetch(`${REST}/generations?select=id,model_id,name,code,year_from,year_to&order=model_id,year_from${filter}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Accept-Profile": "carinfo" },
  });
  const gens = (await res.json()) as Gen[];
  const manifest = await loadManifest();
  const rejected: Record<string, string[]> = existsSync(REJECTED) ? JSON.parse(await readFile(REJECTED, "utf8")) : {};
  const names = new Map(MAKES.flatMap((m) => m.models.map((mo) => [mo.id, { make: m.name, model: mo.name }] as const)));
  const newestFrom = new Map<string, number>();
  for (const g of gens) newestFrom.set(g.model_id, Math.max(newestFrom.get(g.model_id) ?? 0, g.year_from));
  // Each generation of a model gets its own photo.
  const usedBy = (modelId: string) => new Set(gens.filter((g) => g.model_id === modelId && manifest[g.id]?.file).map((g) => manifest[g.id].file!));
  let done = 0;
  for (const gen of gens) {
    if (manifest[gen.id]) continue;
    try {
      const n = names.get(gen.model_id) ?? { make: "", model: "" };
      manifest[gen.id] = await findPhoto(n.make, n.model, gen, gen.year_from === newestFrom.get(gen.model_id), new Set([...usedBy(gen.model_id), ...(rejected[gen.id] ?? [])]));
    } catch (e) {
      console.error(`${gen.model_id} ${gen.name}: ${(e as Error).message}`);
      continue;
    }
    await saveManifest(manifest);
    console.log(`${++done} ${gen.model_id} ${gen.name}: ${manifest[gen.id].status} ${manifest[gen.id].article ?? ""}`);
  }
  const byId = new Map(gens.map((g) => [g.id, g]));
  const rows = Object.entries(manifest)
    .filter(([id]) => byId.has(id))
    .map(([id, e]) => `| ${byId.get(id)!.model_id} | ${byId.get(id)!.name} | ${e.status} | ${e.article ?? e.note ?? ""} | ${e.license ?? ""} |`);
  await writeFile(`${DIR}/report.md`, `| model | generation | status | article | license |\n|---|---|---|---|---|\n${rows.sort().join("\n")}\n`);
  const ok = Object.values(manifest).filter((e) => e.status === "ok").length;
  console.log(`${ok}/${Object.keys(manifest).length} generations have a photo → ${DIR}/report.md`);
}

/**
 * Drops photos that today's rules reject (detail shots, wrong years, one photo shared by several generations of a
 * model: the newest keeps it) plus any generation ids given by hand, then searches again for those.
 */
async function recheckStep(args: string[]) {
  const manifest = await loadManifest();
  // --none: also search again for every generation that had no photo (after a filter fix).
  const rejected: Record<string, string[]> = existsSync(REJECTED) ? JSON.parse(await readFile(REJECTED, "utf8")) : {};
  const drop = args.includes("--none") ? [...args, ...Object.keys(manifest).filter((id) => manifest[id].status === "none")] : args;
  const res = await fetch(`${REST}/generations?select=id,model_id,name,code,year_from,year_to`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Accept-Profile": "carinfo" } });
  const gens = ((await res.json()) as Gen[]).sort((a, b) => b.year_from - a.year_from);
  const seen = new Map<string, string>();
  const removed: string[] = [];
  for (const gen of gens) {
    const e = manifest[gen.id];
    if (!e) continue;
    const key = `${gen.model_id}|${e.file}`;
    const bad = drop.includes(gen.id) || (e.status === "ok" && (!usable(e.file!, gen) || seen.has(key)));
    if (e.status === "ok" && !bad) seen.set(key, gen.id);
    if (bad || (e.status === "none" && drop.includes(gen.id))) {
      if (drop.includes(gen.id) && e.file) (rejected[gen.id] ??= []).push(e.file);
      delete manifest[gen.id];
      removed.push(`${gen.model_id} ${gen.name} (${e.file ?? e.status})`);
    }
  }
  await saveManifest(manifest);
  await writeFile(REJECTED, JSON.stringify(rejected, null, 1) + "\n");
  console.log(`dropped ${removed.length}:\n  ${removed.join("\n  ")}`);
  await fetchStep([]);
}

async function uploadStep() {
  const manifest = await loadManifest();
  for (const [id, e] of Object.entries(manifest)) {
    if (e.status !== "ok" || e.uploaded) continue;
    execFileSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${BUCKET}/gen/${id}.webp`, "--file", `${DIR}/${id}.webp`, "--content-type", "image/webp", "--cache-control", "public, max-age=31536000, immutable", "--remote"],
      { stdio: "inherit" },
    );
    e.uploaded = true;
    await saveManifest(manifest);
  }
}

async function sqlStep() {
  const base = process.env.IMG_BASE?.replace(/\/$/, "");
  if (!base?.startsWith("https://")) throw new Error("set IMG_BASE to the bucket's public https URL");
  const manifest = await loadManifest();
  const rows = Object.entries(manifest).filter(([, e]) => e.status === "ok" && e.uploaded);
  await mkdir(SQL_DIR, { recursive: true });
  const CHUNK = 200;
  for (let i = 0; i * CHUNK < rows.length; i++) {
    const values = rows
      .slice(i * CHUNK, (i + 1) * CHUNK)
      .map(([id, e]) => `(${q(id)}::uuid, ${q(`${base}/gen/${id}.webp`)}, ${q(e.credit!)}, ${q(e.license!)}, ${q(e.source_url!)})`);
    await writeFile(
      `${SQL_DIR}/images-${String(i).padStart(3, "0")}.sql`,
      `update carinfo.generations g set image_url = v.url, image_credit = v.credit, image_license = v.license, image_source_url = v.source
from (values
${values.join(",\n")}
) as v(id, url, credit, license, source)
where g.id = v.id;
`,
    );
  }
  console.log(`${rows.length} photos → ${SQL_DIR}/images-*.sql`);
}

const [step, ...args] = process.argv.slice(2);
if (step === "fetch") await fetchStep(args);
else if (step === "recheck") await recheckStep(args);
else if (step === "upload") await uploadStep();
else if (step === "sql") await sqlStep();
else console.error("usage: images.ts fetch [modelIds...] | recheck [generationIds...] | upload | sql");
