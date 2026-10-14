import { describe, expect, it } from "vitest";
import { isCompletePaintedManifest, REQUIRED_PAINTED_ASSETS } from "../render/painted-assets";

const goodManifest = () => ({
  source_art_verified: 18,
  ring_notch_corrected: true,
  files: REQUIRED_PAINTED_ASSETS.map((file, index) => ({
    file, bytes: 2000 + index, sha256: "d".repeat(64),
  })),
});

describe("optional painted asset activation", () => {
  it("requires the exact twenty intended art files, not a single red ring", () => {
    expect(REQUIRED_PAINTED_ASSETS).toHaveLength(20);
    expect(new Set(REQUIRED_PAINTED_ASSETS).size).toBe(20);
    expect(isCompletePaintedManifest(goodManifest())).toBe(true);
    expect(isCompletePaintedManifest({
      ...goodManifest(),
      files: goodManifest().files.slice(0, 1),
    })).toBe(false);
  });

  it("rejects missing, duplicated, outdated and tampered entries", () => {
    const original = goodManifest();
    expect(isCompletePaintedManifest({ ...original, ring_notch_corrected: false })).toBe(false);
    expect(isCompletePaintedManifest({ ...original, source_art_verified: 17 })).toBe(false);
    expect(isCompletePaintedManifest({
      ...original, files: [...original.files.slice(0, -1), original.files[0]],
    })).toBe(false);
    expect(isCompletePaintedManifest({
      ...original, files: [...original.files.slice(0, -1), {
        file: "unrecognized.webp", bytes: 2000, sha256: "d".repeat(64),
      }],
    })).toBe(false);
    expect(isCompletePaintedManifest({
      ...original, files: original.files.map((f, i) => i === 4
        ? { ...f, sha256: "bad" } : f),
    })).toBe(false);
    expect(isCompletePaintedManifest({ ...original, files: "not an array" })).toBe(false);
    expect(isCompletePaintedManifest(null)).toBe(false);
  });
});
