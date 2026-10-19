import { describe, expect, it } from "vitest";
import {
  ORIGINAL_PAINTED_BANDS, PAINTED_RING_CANVAS, REFERENCE_PAINTED_BANDS,
  sourceRadiusAt, warpRingPixels,
} from "../render/painted-ring-retopology";

/** Frozen original algorithm as an independent pixel-for-pixel oracle. */
function legacyWarp(source: Uint8ClampedArray, artIndex: number): Uint8ClampedArray {
  const size = PAINTED_RING_CANVAS;
  const center = (size - 1) / 2;
  const result = new Uint8ClampedArray(size * size * 4);
  const band = REFERENCE_PAINTED_BANDS[artIndex]!;
  const bound = Math.ceil(band.outer + 1);
  const low = Math.max(0, Math.floor(center - bound));
  const high = Math.min(size - 1, Math.ceil(center + bound));
  for (let y = low; y <= high; y++) {
    const dy = y - center;
    for (let x = low; x <= high; x++) {
      const dx = x - center;
      const radius = Math.hypot(dx, dy);
      const sampleRadius = sourceRadiusAt(radius, artIndex);
      if (sampleRadius === null) continue;
      const sx = center + dx * sampleRadius / radius;
      const sy = center + dy * sampleRadius / radius;
      const x0 = Math.max(0, Math.min(size - 2, Math.floor(sx)));
      const y0 = Math.max(0, Math.min(size - 2, Math.floor(sy)));
      const fx = sx - x0, fy = sy - y0;
      const weights = [
        (1 - fx) * (1 - fy), fx * (1 - fy),
        (1 - fx) * fy, fx * fy,
      ];
      const neighbors = [
        (y0 * size + x0) * 4,
        (y0 * size + x0 + 1) * 4,
        ((y0 + 1) * size + x0) * 4,
        ((y0 + 1) * size + x0 + 1) * 4,
      ];
      let alpha = 0, red = 0, green = 0, blue = 0;
      for (let k = 0; k < 4; k++) {
        const index = neighbors[k]!;
        const coverage = source[index + 3]! * weights[k]!;
        alpha += coverage;
        red += source[index]! * coverage;
        green += source[index + 1]! * coverage;
        blue += source[index + 2]! * coverage;
      }
      if (alpha < 0.1) continue;
      const outIndex = (y * size + x) * 4;
      result[outIndex] = red / alpha;
      result[outIndex + 1] = green / alpha;
      result[outIndex + 2] = blue / alpha;
      result[outIndex + 3] = alpha;
    }
  }
  return result;
}

describe("painted premultiplied ring warp equivalence", () => {
  it("preserves every RGBA byte, including translucent edges and real gaps", () => {
    const size = PAINTED_RING_CANVAS;
    const pixels = new Uint8ClampedArray(size * size * 4);
    for (let p = 0; p < size * size; p++) {
      const offset = p * 4;
      pixels[offset] = (p * 37) % 256;
      pixels[offset + 1] = (p * 61) % 256;
      pixels[offset + 2] = (p * 93) % 256;
      pixels[offset + 3] = p % 17 === 0 ? 0 : p % 11 === 0 ? 80 : 255;
    }
    for (const artIndex of [0, 1, 2, 6]) {
      const legacy = legacyWarp(pixels, artIndex);
      const optimized = warpRingPixels(pixels, artIndex);
      let firstMismatch = -1;
      for (let i = 0; i < legacy.length; i++) {
        if (legacy[i] !== optimized[i]) {
          firstMismatch = i;
          break;
        }
      }
      expect(firstMismatch, `RGBA mismatch in ring ${artIndex} at byte ${firstMismatch}`).toBe(-1);
    }
  });

  it("preserves source-band and failure contracts", () => {
    expect(ORIGINAL_PAINTED_BANDS).toHaveLength(7);
    const pixels = new Uint8ClampedArray(PAINTED_RING_CANVAS ** 2 * 4);
    expect(() => warpRingPixels(pixels, -1)).toThrow(RangeError);
    expect(() => warpRingPixels(pixels, 7)).toThrow(RangeError);
    expect(() => warpRingPixels(new Uint8ClampedArray(32), 0)).toThrow(RangeError);
    const warped = warpRingPixels(pixels, 5);
    expect(warped.length).toBe(pixels.length);
    expect(warped.every((channel) => channel === 0)).toBe(true);
  });
});
