import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/adminAuth";

// The magic link lands here with ?code=…; Supabase sends ?error_description=… instead when the link expired.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const failed = (msg: string) => NextResponse.redirect(new URL(`/admin/login/?error=${encodeURIComponent(msg)}`, req.url));
  if (!code) return failed(req.nextUrl.searchParams.get("error_description") ?? "missing code");
  try {
    await exchangeCode(code);
  } catch (e) {
    return failed((e as Error).message);
  }
  return NextResponse.redirect(new URL("/admin/", req.url));
}
