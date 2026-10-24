"use server";

// Every action checks the admin itself (actionToken) and writes with the admin's own token, so RLS has the last word.
// Validation problems come back as ?error=… on the page (thrown messages are hidden in production).

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { actionToken, adminRest, safeNext, sendMagicLink, signOut } from "@/lib/adminAuth";

const text = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const orNull = (s: string) => s || null;
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const uuid = (s: string) => {
  if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error("bad id");
  return s;
};

export async function login(f: FormData) {
  const email = text(f, "email");
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  try {
    await sendMagicLink(email, origin);
  } catch (e) {
    redirect(`/admin/login/?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect("/admin/login/?sent=1");
}

export async function logout() {
  await signOut();
  redirect("/admin/login/");
}

/** Pros/cons are edited as one item per line per language; both languages must list the same number of items. */
function pairs(sl: string, en: string): { sl: string; en: string }[] | null {
  const a = lines(sl);
  const b = lines(en);
  return a.length === b.length ? a.map((s, i) => ({ sl: s, en: b[i] })) : null;
}

export async function saveGeneration(f: FormData) {
  const id = uuid(text(f, "id"));
  const token = await actionToken();
  const pros = pairs(text(f, "pros_sl"), text(f, "pros_en"));
  const cons = pairs(text(f, "cons_sl"), text(f, "cons_en"));
  if (!pros || !cons) redirect(`/admin/g/${id}/?error=${encodeURIComponent("Prednosti/slabosti: SL in EN morata imeti enako število vrstic.")}`);
  await adminRest(token, `generations?id=eq.${id}`, {
    method: "PATCH",
    body: { summary_sl: orNull(text(f, "summary_sl")), summary_en: orNull(text(f, "summary_en")), pros, cons },
  });
  revalidatePath(`/admin/g/${id}/`);
  redirect(`/admin/g/${id}/?saved=1`);
}

/**
 * reviewed: the generation and everything still ai_checked under it become reviewed (and load_report will no longer
 * overwrite them). skeleton: the report is taken off the site, the generation itself stays. ai_checked: back to the queue.
 */
export async function setGenerationStatus(f: FormData) {
  const id = uuid(text(f, "id"));
  const status = text(f, "status");
  if (!["reviewed", "skeleton", "ai_checked"].includes(status)) throw new Error("bad status");
  const token = await actionToken();
  const now = new Date().toISOString();
  await adminRest(token, `generations?id=eq.${id}`, { method: "PATCH", body: { status, reviewed_at: status === "reviewed" ? now : null } });
  if (status === "reviewed") {
    for (const table of ["engines", "failures"])
      await adminRest(token, `${table}?generation_id=eq.${id}&status=eq.ai_checked`, { method: "PATCH", body: { status, reviewed_at: now } });
    await adminRest(token, `checks?generation_id=eq.${id}&status=eq.ai_checked`, { method: "PATCH", body: { status } });
  }
  revalidatePath("/admin/");
  redirect(safeNext(text(f, "next")));
}

export async function saveEngine(f: FormData) {
  const gid = uuid(text(f, "gid"));
  const token = await actionToken();
  const verdict = text(f, "verdict");
  await adminRest(token, `engines?id=eq.${uuid(text(f, "id"))}`, {
    method: "PATCH",
    body: {
      verdict: ["recommended", "ok", "avoid"].includes(verdict) ? verdict : null,
      summary_sl: orNull(text(f, "summary_sl")),
      summary_en: orNull(text(f, "summary_en")),
    },
  });
  revalidatePath(`/admin/g/${gid}/`);
  redirect(`/admin/g/${gid}/?saved=1#engines`);
}

export async function saveFailure(f: FormData) {
  const gid = uuid(text(f, "gid"));
  const token = await actionToken();
  const status = text(f, "status");
  if (!["ai_checked", "reviewed", "hidden"].includes(status)) throw new Error("bad status");
  await adminRest(token, `failures?id=eq.${uuid(text(f, "id"))}`, {
    method: "PATCH",
    body: {
      title_sl: text(f, "title_sl"),
      title_en: text(f, "title_en"),
      body_sl: orNull(text(f, "body_sl")),
      body_en: orNull(text(f, "body_en")),
      status,
      reviewed_at: status === "reviewed" ? new Date().toISOString() : null,
    },
  });
  revalidatePath(`/admin/g/${gid}/`);
  redirect(`/admin/g/${gid}/?saved=1#failures`);
}

export async function saveCheck(f: FormData) {
  const gid = uuid(text(f, "gid"));
  const token = await actionToken();
  const status = text(f, "status");
  if (!["ai_checked", "reviewed", "hidden"].includes(status)) throw new Error("bad status");
  await adminRest(token, `checks?id=eq.${uuid(text(f, "id"))}`, {
    method: "PATCH",
    body: { text_sl: text(f, "text_sl"), text_en: text(f, "text_en"), status },
  });
  revalidatePath(`/admin/g/${gid}/`);
  redirect(`/admin/g/${gid}/?saved=1#checks`);
}

export async function deleteLink(f: FormData) {
  const gid = uuid(text(f, "gid"));
  const token = await actionToken();
  await adminRest(token, `links?id=eq.${uuid(text(f, "id"))}`, { method: "DELETE" });
  revalidatePath(`/admin/g/${gid}/`);
  redirect(`/admin/g/${gid}/?saved=1#links`);
}

export async function resolveReport(f: FormData) {
  const token = await actionToken();
  await adminRest(token, `reports?id=eq.${uuid(text(f, "id"))}`, { method: "PATCH", body: { resolved: text(f, "resolved") === "true" } });
  revalidatePath("/admin/reports/");
  redirect(safeNext(text(f, "next")));
}
