import { NextResponse, type NextRequest } from "next/server";
import { refreshSession, safeNext } from "@/lib/adminAuth";

// Pages cannot set cookies, so requireAdmin sends an expired session here and this sends it back to `next`.
export async function GET(req: NextRequest) {
  const token = await refreshSession();
  const to = token ? safeNext(req.nextUrl.searchParams.get("next")) : "/admin/login/";
  return NextResponse.redirect(new URL(to, req.url));
}
