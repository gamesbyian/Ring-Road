import { describe, expect, it } from "vitest";
import { CAMPAIGN, CAMPAIGN_ANALYSES, validateCampaign } from "../content/campaign";
import {
  alignedSpoke,
  clockwiseDistance,
  counterClockwiseDistance,
  normalizeState,
  ringTargetStatesForSpoke,
  rotateState,
  spokeFromState,
  validatePuzzleShape,
} from "../domain/puzzle";
import { analyzePuzzle } from "../domain/solver";

describe("puzzle mathematics", () => {
  it("normalizes positive and negative states", () => {
    expect(normalizeState(-1, 5)).toBe(4);
    expect(normalizeState(12, 5)).toBe(2);
  });

  it("moves exactly one discrete step and wraps", () => {
    expect(rotateState(0, 3, -1)).toBe(2);
    expect(rotateState(2, 3, 1)).toBe(0);
  });

  it("maps only orientations that land on a center spoke", () => {
    expect(spokeFromState(0, 7, 3)).toBe(0);
    expect(spokeFromState(1, 7, 3)).toBeNull();
    expect(ringTargetStatesForSpoke(6, 2, 3)).toEqual([4]);
  });

  it("distinguishes aligned and non-aligned configurations", () => {
    expect(alignedSpoke([0, 0, 0, 0, 0, 0, 0], [3, 5, 7, 11, 13, 17, 19])).toBe(0);
    expect(alignedSpoke([1, 0, 0, 0, 0, 0, 0], [3, 5, 7, 11, 13, 17, 19])).toBeNull();
  });

  it("computes clockwise and counterclockwise distances", () => {
    expect(clockwiseDistance(4, 1, 5)).toBe(2);
    expect(counterClockwiseDistance(4, 1, 5)).toBe(3);
  });
});

describe("campaign and exact solver", () => {
  it("preserves representative prototype puzzle states", () => {
    expect(CAMPAIGN[0]).toMatchObject({
      targetMoves: 11,
      ringCycles: [3, 5, 3, 5, 7, 3, 5],
      initial: [2, 2, 1, 2, 4, 0, 2],
    });
    expect(CAMPAIGN[7]).toMatchObject({
      targetMoves: 16,
      ringCycles: [5, 11, 11, 19, 3, 3, 19],
      initial: [2, 4, 0, 0, 0, 0, 5],
    });
    expect(CAMPAIGN[11]).toMatchObject({
      targetMoves: 21,
      ringCycles: [3, 5, 17, 19, 5, 11, 19],
      initial: [1, 0, 13, 13, 2, 3, 17],
    });
  });

  it("satisfies all cycle and state constraints", () => {
    CAMPAIGN.forEach((puzzle) => expect(validatePuzzleShape(puzzle)).toEqual([]));
    expect(validateCampaign).not.toThrow();
  });

  it("rejects invalid identity and authoring assertions", () => {
    const valid = CAMPAIGN[0];
    expect(validatePuzzleShape({ ...valid, id: 0 })).toContain("id must be a positive integer");
    expect(validatePuzzleShape({
      ...valid,
      authoring: { ...valid.authoring, expectedExactVectorCount: 0 },
    })).toContain("expectedExactVectorCount must be a positive integer");
  });

  it("matches every puzzle's explicit uniqueness expectation", () => {
    CAMPAIGN.forEach((puzzle, index) => {
      expect(CAMPAIGN_ANALYSES[index]?.exactSolutionVectorCount).toBe(puzzle.authoring.expectedExactVectorCount);
    });
  });

  it("retains required continuous same-direction wraps", () => {
    CAMPAIGN.forEach((puzzle, index) => {
      if (puzzle.authoring.requireWrapInIntendedPlan) expect(CAMPAIGN_ANALYSES[index]?.usesWraps).toBe(true);
    });
  });

  it("counts wrapped directed allocations as distinct exact vectors", () => {
    const analysis = analyzePuzzle({
      id: 99,
      targetMoves: 2,
      ringCycles: [2, 2, 2, 2, 2, 2, 2],
      initial: [0, 0, 0, 0, 0, 0, 0],
      authoring: { requireWrapInIntendedPlan: true, expectedExactVectorCount: 1 },
    });
    expect(analysis.exactSolutionVectorCount).toBeGreaterThan(0);
    expect(analysis.usesWraps).toBe(true);
  });
});

describe("ring geometry", () => {
  it("caches deterministic marker and notch geometry", async () => {
    const { ringGeometry } = await import("../render/ring-geometry");
    const first = ringGeometry(92, 13);
    const second = ringGeometry(92, 13);
    expect(second).toBe(first);
    expect(first.markerPoints).toHaveLength(13);
    expect(first.notchFaces).toHaveLength(2);
    expect(first.circumference).toBeCloseTo(2 * Math.PI * 92);
    expect(first.gapLength).toBeGreaterThan(0);
    expect(first.gapLength).toBeLessThan(first.circumference);
    expect(first.innerRadius).toBeLessThan(first.radius);
    expect(first.outerRadius).toBeGreaterThan(first.radius);
    expect(first.innerGapLength / first.innerRadius).toBeCloseTo(first.outerGapLength / first.outerRadius);
  });

  it("rejects invalid renderer geometry inputs", async () => {
    const { ringGeometry } = await import("../render/ring-geometry");
    expect(() => ringGeometry(8, 3)).toThrow("radius");
    expect(() => ringGeometry(92, 0)).toThrow("cycle");
    expect(() => ringGeometry(92, 2.5)).toThrow("cycle");
  });
});

describe("construct-from-solution authoring", () => {
  it("reconstructs a campaign puzzle from its selected exact directed plan", async () => {
    const { constructPuzzle } = await import("../domain/authoring");
    const source = CAMPAIGN[0];
    const selected = CAMPAIGN_ANALYSES[0]?.exactPlan?.selectedRingOptions;
    if (!selected || selected.length !== 7) throw new Error("Missing representative campaign plan");
    const reconstructed = constructPuzzle({
      id: source.id,
      ringCycles: source.ringCycles,
      sharedSpoke: CAMPAIGN_ANALYSES[0]!.exactPlan!.sharedSpoke,
      intendedMoves: [
        selected[0]!,
        selected[1]!,
        selected[2]!,
        selected[3]!,
        selected[4]!,
        selected[5]!,
        selected[6]!,
      ],
      expectedExactVectorCount: source.authoring.expectedExactVectorCount,
    });
    expect(reconstructed.initial).toEqual(source.initial);
    expect(reconstructed.targetMoves).toBe(source.targetMoves);
    expect(analyzePuzzle(reconstructed).exactSolutionVectorCount).toBe(1);
  });

  it("rejects out-of-range spokes and negative move allocations", async () => {
    const { constructPuzzle } = await import("../domain/authoring");
    const construction = {
      id: 99,
      ringCycles: [3, 5, 7, 11, 13, 17, 19] as const,
      intendedMoves: [
        { direction: 1 as const, moveCount: 1 },
        { direction: 1 as const, moveCount: 1 },
        { direction: 1 as const, moveCount: 1 },
        { direction: 1 as const, moveCount: 1 },
        { direction: 1 as const, moveCount: 1 },
        { direction: 1 as const, moveCount: 1 },
        { direction: 1 as const, moveCount: 1 },
      ] as const,
      expectedExactVectorCount: 1,
    };
    expect(() => constructPuzzle({ ...construction, sharedSpoke: 3 })).toThrow("shared spoke");
    const invalidMoves = [
      { direction: 1 as const, moveCount: -1 },
      construction.intendedMoves[1],
      construction.intendedMoves[2],
      construction.intendedMoves[3],
      construction.intendedMoves[4],
      construction.intendedMoves[5],
      construction.intendedMoves[6],
    ] as const;
    expect(() => constructPuzzle({ ...construction, sharedSpoke: 0, intendedMoves: invalidMoves })).toThrow("non-negative");
  });
});
