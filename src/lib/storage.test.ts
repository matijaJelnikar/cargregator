import { describe, expect, it } from "vitest";
import { mergeBackup, type SavedCar, type SavedSearch } from "./storage";

const search = (id: string): SavedSearch => ({ id, name: id, query: "r=300", createdAt: "2026-10-01T00:00:00.000Z" });
const car = (id: string) =>
  ({ id, title: id, addedAt: "2026-10-01T00:00:00.000Z", input: { country: "DE", fuel: "petrol" } }) as SavedCar;

describe("backup", () => {
  it("adds only entries that aren't stored yet", () => {
    const merged = mergeBackup(
      { saved: [search("a")], cars: [car("x")] },
      { app: "cargregator", version: 1, saved: [search("a"), search("b"), { id: 3 }], cars: [car("x"), car("y"), { id: "z" }] },
    );
    expect(merged?.saved.map((s) => s.id)).toEqual(["a", "b"]);
    expect(merged?.cars.map((c) => c.id)).toEqual(["x", "y"]);
    expect(merged?.added).toBe(2);
  });

  it("rejects anything that isn't a backup", () => {
    const empty = { saved: [], cars: [] };
    expect(mergeBackup(empty, null)).toBeNull();
    expect(mergeBackup(empty, { saved: [], cars: [] })).toBeNull();
    expect(mergeBackup(empty, { app: "cargregator", saved: {}, cars: [] })).toBeNull();
  });
});
