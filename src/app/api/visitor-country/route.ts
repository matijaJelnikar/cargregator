// Request-specific location must never enter the shared car-page cache.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country = request.headers.get("cf-ipcountry")?.toUpperCase();
  return Response.json(
    { country: country && /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : null },
    { headers: { "Cache-Control": "private, no-store", Vary: "CF-IPCountry" } },
  );
}
