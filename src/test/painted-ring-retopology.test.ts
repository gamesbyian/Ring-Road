import { describe, expect, it } from "vitest";
import {
  ORIGINAL_PAINTED_BANDS, REFERENCE_PAINTED_BANDS, paintedRingSpriteUrl,
  sourceRadiusAt,
} from "../render/painted-ring-retopology";

describe("painted source-exact radial ring correction", () => {
  it("keeps exactly seven concentric visible source bands in source order", () => {
    expect(ORIGINAL_PAINTED_BANDS).toHaveLength(7);
    expect(REFERENCE_PAINTED_BANDS).toHaveLength(7);
    expect(REFERENCE_PAINTED_BANDS[0]?.outer).toBe(350);
    for (let index = 0; index < 7; index++) {
      const ring = REFERENCE_PAINTED_BANDS[index]!;
      expect(ring.inner).toBeGreaterThan(0);
      expect(ring.outer).toBeGreaterThan(ring.inner);
      if (index < 6) {
        expect(ring.inner).toBeGreaterThan(REFERENCE_PAINTED_BANDS[index + 1]!.outer);
      }
    }
  });

  it("maps both boundaries and midpoint, without changing the angular coordinate", () => {
    for (let index = 0; index < 7; index++) {
      const original = ORIGINAL_PAINTED_BANDS[index]!;
      const corrected = REFERENCE_PAINTED_BANDS[index]!;
      expect(sourceRadiusAt(corrected.inner, index)).toBeCloseTo(original.inner, 8);
      expect(sourceRadiusAt(corrected.outer, index)).toBeCloseTo(original.outer, 8);
      expect(sourceRadiusAt((corrected.inner + corrected.outer) / 2, index)).toBeCloseTo(
        (original.inner + original.outer) / 2, 8,
      );
      expect(sourceRadiusAt(corrected.inner - 0.01, index)).toBeNull();
      expect(sourceRadiusAt(corrected.outer + 0.01, index)).toBeNull();
    }
  });

  it("never invents ring data at invalid radii or indices", () => {
    expect(sourceRadiusAt(Number.NaN, 0)).toBeNull();
    expect(sourceRadiusAt(Number.POSITIVE_INFINITY, 0)).toBeNull();
    expect(sourceRadiusAt(30, -1)).toBeNull();
    expect(sourceRadiusAt(30, 7)).toBeNull();
    expect(paintedRingSpriteUrl("ring-1-red-normalized.webp", "/base/")).toBe(
      "/base/ring-1-red-normalized.webp",
    );
  });
});
