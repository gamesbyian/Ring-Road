import { describe, expect, it } from "vitest";
import { CAMPAIGN } from "../content/campaign";
import {
  ART_ORDER_TO_DOMAIN, NATIVE_GAP_DEGREES, PAINTED_RING_COLORS, paintedRingDegrees,
} from "../render/painted-geometry";

describe("painted sprite to real domain mapping", () => {
  const puzzle = CAMPAIGN[0];

  it("reverses the seven supplied art circles into the existing seven domain indices", () => {
    expect(PAINTED_RING_COLORS).toEqual(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]);
    expect(ART_ORDER_TO_DOMAIN).toEqual([6, 5, 4, 3, 2, 1, 0]);
  });

  it("rejects incorrect sprite indices instead of silently rotating a wrong ring", () => {
    expect(() => paintedRingDegrees(puzzle, puzzle.initial, 0, 7)).toThrow(RangeError);
    expect(() => paintedRingDegrees(puzzle, puzzle.initial, 0, -1)).toThrow(RangeError);
  });

  it("one logical ring rotation changes only its own graphic by one discrete step", () => {
    const visual = [...puzzle.initial];
    const original = Array.from({ length: 7 }, (_, art) =>
      paintedRingDegrees(puzzle, visual, 0, art));
    visual[0] = (visual[0] ?? 0) + 1;
    const next = Array.from({ length: 7 }, (_, art) =>
      paintedRingDegrees(puzzle, visual, 0, art));
    for (let art = 0; art < 6; art++) expect(next[art]).toBe(original[art]);
    expect((next[6] ?? 0) - (original[6] ?? 0)).toBeCloseTo(360 / puzzle.ringCycles[0], 10);
  });

  it("keeps the animation continuous when the normalized domain state wraps", () => {
    for (const art of [0, 1, 2, 3, 4, 5, 6]) {
      const domain = ART_ORDER_TO_DOMAIN[art];
      expect(domain).toBeDefined();
      const cycle = puzzle.ringCycles[domain!];
      const before = [...puzzle.initial], after = [...before];
      before[domain!] = cycle - 1;
      after[domain!] = cycle;
      const difference = paintedRingDegrees(puzzle, after, 0, art) -
        paintedRingDegrees(puzzle, before, 0, art);
      expect(difference).toBeCloseTo(360 / cycle, 10);
    }
  });

  it("calibrated native gap aligns with the real source's east-facing gap", () => {
    const zeros = Array.from({ length: 7 }, () => 0);
    for (let art = 0; art < 7; art++) {
      expect(paintedRingDegrees(puzzle, zeros, 0, art) + NATIVE_GAP_DEGREES[art]!).toBe(0);
    }
  });

  it("board cosmetic angle is equal for all rings and does not change their gameplay state", () => {
    const original = Array.from({ length: 7 }, (_, art) =>
      paintedRingDegrees(puzzle, puzzle.initial, 0, art));
    const next = Array.from({ length: 7 }, (_, art) =>
      paintedRingDegrees(puzzle, puzzle.initial, 1, art));
    for (let art = 0; art < 7; art++) {
      expect((next[art] ?? 0) - (original[art] ?? 0)).toBeCloseTo(360 / puzzle.ringCycles[0], 10);
    }
  });
});
