// Sign-in for the review site (/admin): Supabase Auth magic links with PKCE over plain fetch, the session in httpOnly
// cookies. Nothing here is trusted on its own: every read and write goes to PostgREST with the admin's own token, so
// row level security (carinfo.is_admin()) decides what an account may do. No service key exists in this app.

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PUBLISHABLE_KEY, REST } from "./carinfoDb";

const AUTH = REST.replace("/rest/v1", "/auth/v1");
const ACCESS = "cg_admin_at";
const REFRESH = "cg_admin_rt";
const VERIFIER = "cg_admin_pkce";
const COOKIE = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin" } as const;

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Seconds since epoch at which a JWT expires (0 if it cannot be read). Only used to avoid sending stale tokens. */
export function jwtExpiry(token: string): number {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(atob(payload)).exp) || 0;
  } catch {
    return 0;
  }
}

const fresh = (token: string | undefined): token is string => !!token && jwtExpiry(token) > Date.now() / 1000 + 30;

async function authPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AUTH}/${path}`, {
    method: "POST",
    headers: { apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`auth ${path.split("?")[0]}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Emails a sign-in link to an existing account (no sign-ups); the link comes back to /admin/auth/callback/. */
export async function sendMagicLink(email: string, origin: string): Promise<void> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const redirectTo = encodeURIComponent(`${origin}/admin/auth/callback/`);
  await authPost(`otp?redirect_to=${redirectTo}`, { email, create_user: false, code_challenge: challenge, code_challenge_method: "s256" });
  (await cookies()).set(VERIFIER, verifier, { ...COOKIE, maxAge: 3600 });
}

async function saveSession(t: Tokens) {
  const store = await cookies();
  store.set(ACCESS, t.access_token, { ...COOKIE, maxAge: t.expires_in });
  store.set(REFRESH, t.refresh_token, { ...COOKIE, maxAge: 30 * 86400 });
}

/** Callback: trades the link's code (plus the verifier this browser kept) for a session. */
export async function exchangeCode(code: string): Promise<void> {
  const store = await cookies();
  const verifier = store.get(VERIFIER)?.value;
  if (!verifier) throw new Error("open the link in the browser where you asked for it");
  await saveSession(await authPost<Tokens>("token?grant_type=pkce", { auth_code: code, code_verifier: verifier }));
  store.delete({ name: VERIFIER, path: COOKIE.path });
}

/** New tokens from the refresh token; only callable where cookies may be set (route handlers, server actions). */
export async function refreshSession(): Promise<string | null> {
  const refreshToken = (await cookies()).get(REFRESH)?.value;
  if (!refreshToken) return null;
  try {
    const t = await authPost<Tokens>("token?grant_type=refresh_token", { refresh_token: refreshToken });
    await saveSession(t);
    return t.access_token;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  const token = store.get(ACCESS)?.value;
  if (fresh(token)) await fetch(`${AUTH}/logout`, { method: "POST", headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } }).catch(() => {});
  for (const name of [ACCESS, REFRESH, VERIFIER]) store.delete({ name, path: COOKIE.path });
}

async function isAdmin(token: string): Promise<boolean> {
  const res = await fetch(`${REST}/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, "Content-Profile": "carinfo", "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  return res.ok && (await res.json()) === true;
}

/**
 * For admin pages: the admin's token, or a redirect (to the refresh route when only the access token ran out, to
 * the login page otherwise). Pages cannot set cookies, so refreshing goes through a route handler and back to `path`.
 */
export const requireAdmin = cache(async (path: string): Promise<string> => {
  const store = await cookies();
  const token = store.get(ACCESS)?.value;
  if (!fresh(token)) redirect(store.has(REFRESH) ? `/admin/auth/refresh/?next=${encodeURIComponent(path)}` : "/admin/login/");
  if (!(await isAdmin(token))) redirect("/admin/login/?denied=1");
  return token;
});

/** For server actions: the admin's token (refreshed in place if needed); throws for anyone else. */
export async function actionToken(): Promise<string> {
  const current = (await cookies()).get(ACCESS)?.value;
  const token = fresh(current) ? current : await refreshSession();
  if (!token || !(await isAdmin(token))) throw new Error("not signed in as an admin");
  return token;
}

/** PostgREST on schema carinfo as the signed-in admin; never cached. */
export async function adminRest<T = unknown>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${REST}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Accept-Profile": "carinfo",
      "Content-Profile": "carinfo",
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`carinfo ${init.method ?? "GET"} ${path.split("?")[0]}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Only same-site admin paths may be redirect targets. */
export const safeNext = (next: string | null) => (next && /^\/admin\/[\w\-/?=&.%]*$/.test(next) && !next.includes("//") ? next : "/admin/");
