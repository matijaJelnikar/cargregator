import { afterEach, describe, expect, it, vi } from "vitest";
import { getRelatedEngines, type CarEngine } from "./carinfoDb";

const engine = { engine_code: "EA211", fuel: "petrol", ccm: 1395 } as CarEngine;

afterEach(() => vi.unstubAllGlobals());

describe("also found in", () => {
  it("does not infer matches from missing codes or displacement", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await getRelatedEngines({ ...engine, engine_code: null }, "volkswagen-golf")).toEqual([]);
    expect(await getRelatedEngines({ ...engine, engine_code: " " }, "volkswagen-golf")).toEqual([]);
    expect(await getRelatedEngines({ ...engine, ccm: null }, "volkswagen-golf")).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires matching code, fuel and displacement, excludes the current model and links supported cars", async () => {
    const row = {
      id: "engine-id", slug: "1-4-tsi-92kw", name: "1.4 TSI", kw: 92,
      year_from: 2014, year_to: 2018,
      generations: { slug: "5e", name: "III", model_id: "skoda-octavia" },
    };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [
      row, { ...row, id: "unknown", generations: { ...row.generations, model_id: "unknown-car" } },
    ] });
    vi.stubGlobal("fetch", fetch);
    const result = await getRelatedEngines(engine, "volkswagen-golf");
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get("engine_code")).toBe("eq.EA211");
    expect(url.searchParams.get("fuel")).toBe("eq.petrol");
    expect(url.searchParams.get("ccm")).toBe("eq.1395");
    expect(url.searchParams.get("generations.model_id")).toBe("neq.volkswagen-golf");
    expect(url.searchParams.get("select")).toContain("generations!inner");
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/avti/skoda/octavia/5e/1-4-tsi-92kw/");
    expect(result[0].year_from).toBe(2014);
  });
});
