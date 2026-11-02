// Verified, model-scoped corrections. These are engine types/families, not a claim
// that every component or engine suffix is identical. Evidence: docs/ENGINE-CODE-AUDIT.md.
export interface CodeFix {
  model: string; generation: string; name: string; fuel: string; kw: number;
  ccm: number; oldCode: string | null; code: string;
}

export const CODE_FIXES: CodeFix[] = [
  { model: "dacia-jogger", generation: "mk1", name: "1.0 TCe 110", fuel: "petrol", kw: 81, ccm: 999, oldCode: null, code: "H5D" },
  { model: "dacia-sandero", generation: "mk3", name: "1.0 TCe 110", fuel: "petrol", kw: 81, ccm: 999, oldCode: "HR10", code: "H5D" },
  { model: "dacia-sandero", generation: "mk3", name: "1.0 TCe 90", fuel: "petrol", kw: 67, ccm: 999, oldCode: "HR10", code: "H4Dt" },
  { model: "dacia-sandero", generation: "mk3", name: "1.0 TCe 100", fuel: "petrol", kw: 74, ccm: 999, oldCode: "HR10", code: "H4Dt" },
  { model: "dacia-sandero", generation: "mk3", name: "1.0 TCe 90 Eco-G", fuel: "lpg", kw: 67, ccm: 999, oldCode: "HR10", code: "H4Dt" },
  { model: "dacia-sandero", generation: "mk3", name: "1.0 TCe 100 Eco-G", fuel: "lpg", kw: 74, ccm: 999, oldCode: "HR10", code: "H4Dt" },
  ...[67, 74].map((kw) => ({ model: "dacia-jogger", generation: "mk1", name: "1.0 TCe 100 Eco-G (LPG)", fuel: "lpg", kw, ccm: 999, oldCode: null, code: "H4Dt" })),
  ...[51, 69].map((kw) => ({ model: "dacia-jogger", generation: "mk1", name: "Hybrid 140", fuel: "hybrid", kw, ccm: 1598, oldCode: null, code: "H4M" })),
];

/** Only correct the specific old value and verified identity; preserve newer/manual codes. */
export function correctedEngineCode(row: Omit<CodeFix, "oldCode" | "code" | "ccm"> & { code: string | null; ccm: number | null }) {
  const fix = CODE_FIXES.find((f) => f.model === row.model && f.generation === row.generation && f.name === row.name
    && f.fuel === row.fuel && f.kw === row.kw && f.ccm === row.ccm && f.oldCode === row.code);
  return fix?.code ?? row.code;
}

export function engineIdentityIssues(row: { code: string | null; fuel: string; ccm: number | null }): string[] {
  if (row.fuel === "electric") return [];
  const issues: string[] = [];
  if (!row.code?.trim()) issues.push("missing engine code; excluded from Also found in");
  if (!row.ccm || row.ccm < 0) issues.push("missing/invalid displacement; excluded from Also found in");
  if (row.code && row.code !== row.code.trim()) issues.push("engine code has surrounding whitespace");
  return issues;
}
