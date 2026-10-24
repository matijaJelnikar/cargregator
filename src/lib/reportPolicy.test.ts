import { describe, expect, it } from "vitest";
import type { CarEngine, CarFailure, CarGeneration } from "./carinfoDb";
import { costBand, publicVerdict, showExactCost, supportedFailures } from "./reportPolicy";

const engine = (id: string, name: string, verdict: CarEngine["verdict"] = "avoid") => ({ id, name, verdict }) as CarEngine;
const failure = (engine_id: string | null, ai_check: CarFailure["ai_check"]) => ({ engine_id, ai_check }) as CarFailure;
const gen = (status: CarGeneration["status"], failures: CarFailure[]) =>
  ({ status, engines: [engine("a110", "1.2 TSI"), engine("a77", "1.2 TSI"), engine("d", "2.0 TDI", "ok")], failures }) as unknown as CarGeneration;

describe("report policy", () => {
  it("counts supported failures of any power of the same engine, not generation-wide ones", () => {
    const g = gen("ai_checked", [failure("a110", "supported"), failure("a77", "supported"), failure("a77", "weak"), failure(null, "supported"), failure("d", "supported")]);
    expect(supportedFailures(engine("a110", "1.2 TSI"), g)).toBe(2);
  });

  it("keeps an unreviewed avoid only with two supported failures", () => {
    expect(publicVerdict(engine("a110", "1.2 TSI"), gen("ai_checked", [failure("a110", "supported"), failure("a77", "supported")]))).toBe("avoid");
    expect(publicVerdict(engine("a110", "1.2 TSI"), gen("ai_checked", [failure("a110", "supported"), failure("a77", "weak")]))).toBe("issues");
  });

  it("shows a reviewed verdict as is and leaves other verdicts alone", () => {
    expect(publicVerdict(engine("a110", "1.2 TSI"), gen("reviewed", []))).toBe("avoid");
    expect(publicVerdict(engine("d", "2.0 TDI", "ok"), gen("ai_checked", []))).toBe("ok");
    expect(publicVerdict(engine("d", "2.0 TDI", null), gen("ai_checked", []))).toBeNull();
  });

  it("bands repair costs by the upper estimate", () => {
    expect(costBand({ cost_min: 100, cost_max: 499 })).toBe("low");
    expect(costBand({ cost_min: 300, cost_max: 1500 })).toBe("med");
    expect(costBand({ cost_min: 1000, cost_max: null })).toBe("med");
    expect(costBand({ cost_min: 800, cost_max: 3000 })).toBe("high");
    expect(costBand({ cost_min: null, cost_max: null })).toBeNull();
  });

  it("shows exact costs only for reviewed generations", () => {
    expect(showExactCost({ status: "reviewed" })).toBe(true);
    expect(showExactCost({ status: "ai_checked" })).toBe(false);
  });
});
