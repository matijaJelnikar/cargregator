import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("visitor country", () => {
  it.each(["en", "sl"])("identifies Slovenia independently of %s language", async (language) => {
    const response = GET(new Request("https://example.com/api/visitor-country/", {
      headers: { "cf-ipcountry": "SI", "accept-language": language },
    }));
    expect(await response.json()).toEqual({ country: "SI" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("keeps countries separate across consecutive requests", async () => {
    for (const country of ["SI", "DE", "AT"]) {
      const response = GET(new Request("https://example.com/api/visitor-country/", { headers: { "cf-ipcountry": country } }));
      expect(await response.json()).toEqual({ country });
    }
  });

  it.each([null, "XX", "T1", "invalid"])("does not infer a country from browser language when location is %s", async (country) => {
    const headers = new Headers({ "accept-language": "sl" });
    if (country) headers.set("cf-ipcountry", country);
    expect(await GET(new Request("https://example.com/api/visitor-country/", { headers })).json()).toEqual({ country: null });
  });
});
