import { describe, expect, it } from "vitest";
import { progressBeadIndex, PROGRESS_BEADS } from "../app/campaign-progress";

describe("reference plaque campaign progress beads", () => {
  it("maps twelve puzzles into the six visible illustrated beads", () => {
    expect(PROGRESS_BEADS).toBe(6);
    expect(Array.from({ length: 12 }, (_, n) => progressBeadIndex(n, 12)))
      .toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
  it("scales to campaign size and clamps safely at navigation edges", () => {
    expect(Array.from({ length: 6 }, (_, n) => progressBeadIndex(n, 6)))
      .toEqual([0, 1, 2, 3, 4, 5]);
    expect(progressBeadIndex(-1, 12)).toBe(0);
    expect(progressBeadIndex(100, 12)).toBe(5);
    expect(progressBeadIndex(0, 0)).toBe(0);
    expect(progressBeadIndex(NaN, 12)).toBe(0);
  });
});
