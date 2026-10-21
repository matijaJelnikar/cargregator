// EEA commercial names ("GOLF / 1.6 / TDI", "520D XDRIVE", "3ERREIHE", "C 220 D") → our model ids, by plain rules.
// No AI: names that match no rule are listed in the build report instead of being guessed.

import type { Make } from "../../src/data/makes.ts";

/** "Mercedes-Benz C 220 d" → ["MERCEDES", "BENZ", "C", "220", "D"] */
export function tokens(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

const compact = (s: string) => tokens(s).join("");

/** Words that may precede the model name besides the make's own. */
const LEADING_WORDS = new Set(["VW", "VOLKSWAGEN", "MERCEDES", "BENZ", "AMG", "VAUXHALL", "NEW", "NUOVA", "NOUVELLE"]);

// BMW and Mercedes name the engine, not the series: 520d, M340i, C 220 d, GLC300.
const BMW_ENGINE = /^M?([1-8])\d{2}[A-Z]*$/;
const MERCEDES_CLASS = /^(A|B|C|E|S|V|G|CLA|CLS|GLA|GLB|GLC|GLE|GLS|GLK|ML|SLK|SL|EQA|EQB|EQC|EQE)(\d{2,3}[A-Z]*)?$/;

const GLUED = /^([SXE]DRIVE|4MOTION|QUATTRO|4MATIC|ALL4)/;

interface Alias {
  modelId: string;
  name: string;
  /** Number-only names (208, 3, 911) only count as the first word, so "CX-80 2.5" isn't a Mazda 2. */
  numeric: boolean;
}

function aliases(make: Make): Alias[] {
  const makeName = compact(make.name);
  const list: Alias[] = [];
  for (const m of make.models) {
    const name = compact(m.name);
    const numeric = /^\d+$/.test(name);
    const add = (n: string) => list.push({ modelId: m.id, name: n, numeric });
    add(name);
    add(makeName + name); // MAZDA3, POLESTAR2
    // Models named with the make (DS 7, MG4) appear without it once the make words are skipped.
    if (name.startsWith(makeName) && name.length > makeName.length) {
      const rest = name.slice(makeName.length);
      list.push({ modelId: m.id, name: rest, numeric: /^\d+$/.test(rest) });
    }
    const series = m.name.match(/^(\d) Series$/);
    for (const n of series ? ["SERIES", "SERIE", "ER", "ERREIHE", "REIHE"] : []) {
      add(series![1] + n);
      add(n + series![1]);
    }
    const cls = m.name.match(/^([A-Z])-Class$/);
    for (const n of cls ? ["CLASS", "KLASSE", "CLASSE"] : []) {
      add(cls![1] + n);
      add(n + cls![1]);
    }
  }
  // Longest first: "GOLFSPORTSVAN" before "GOLF", "RANGEROVERSPORT" before "RANGEROVER".
  return list.sort((a, b) => b.name.length - a.name.length);
}

const cache = new Map<string, Alias[]>();

export function modelFor(make: Make, cn: string): string | undefined {
  const found = match(make, tokens(cn));
  if (found) return found;
  // The make glued to the model: LEXUSCT200H, MINIONE.
  const makeName = compact(make.name);
  const words = tokens(cn);
  const i = words.findIndex((w) => w.startsWith(makeName) && w.length > makeName.length);
  if (i === -1) return undefined;
  return match(make, [...words.slice(0, i), makeName, words[i].slice(makeName.length), ...words.slice(i + 1)]);
}

function match(make: Make, words: string[]): string | undefined {
  const makeWords = new Set([...tokens(make.name), ...LEADING_WORDS]);
  let first = 0;
  while (first < words.length && makeWords.has(words[first])) first++;
  if (first === words.length) return undefined;

  if (!cache.has(make.id)) cache.set(make.id, aliases(make));
  for (const a of cache.get(make.id)!) {
    // The model name may start at the first or second word after the make ("GRAND C4 PICASSO").
    const starts = a.numeric ? [first] : [first, first + 1];
    for (const i of starts) {
      let joined = "";
      for (let j = i; j < words.length && joined.length < a.name.length; j++) joined += words[j];
      if (joined === a.name) return a.modelId;
    }
  }

  const word = words[first];
  if (make.id === "bmw") {
    const n = word.match(BMW_ENGINE)?.[1];
    if (n) return `bmw-${n}-series`;
  }
  if (make.id === "mercedes-benz") {
    const m = word.match(MERCEDES_CLASS);
    const next = words[first + 1] ?? "";
    if (m && (m[2] || /^\d{2,3}[A-Z]*$/.test(next))) {
      const cls = m[1];
      const id = cls.length === 1 ? `mercedes-benz-${cls.toLowerCase()}-class` : `mercedes-benz-${cls.toLowerCase()}`;
      if (make.models.some((x) => x.id === id)) return id;
    }
  }
  for (const a of cache.get(make.id)!) {
    // Short letter names glued to the engine: RX450H, NX300H, GLC300.
    if (/^[A-Z]{2,3}$/.test(a.name) && new RegExp(`^${a.name}\\d{2,3}[A-Z]*$`).test(word)) return a.modelId;
    // Names glued to the drivetrain or body: X3XDRIVE20D, TIGUAN4MOTION, A4AVANT, COOPERCABRIO.
    const rest = word.slice(a.name.length);
    if (!a.numeric && word.startsWith(a.name) && (GLUED.test(rest) || /^[A-Z]{4,}$/.test(rest))) return a.modelId;
  }
  return undefined;
}
