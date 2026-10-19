import { describe, expect, it } from "vitest";
import { landscapeDimensions } from "../render/PaintedScene";

describe("painted viewport layout projection", () => {
  it("uses the same landscape logical size for portrait and landscape screens", () => {
    expect(landscapeDimensions(568, 320)).toEqual({long: 568, short: 320});
    expect(landscapeDimensions(320, 568)).toEqual({long: 568, short: 320});
    expect(landscapeDimensions(844, 390)).toEqual({long: 844, short: 390});
    expect(landscapeDimensions(390, 844)).toEqual({long: 844, short: 390});
  });

  it("preserves source-native and taller desktop proportions", () => {
    expect(landscapeDimensions(1536, 864)).toEqual({long: 1536, short: 864});
    expect(landscapeDimensions(1024, 768)).toEqual({long: 1024, short: 768});
    expect(landscapeDimensions(1440, 1000)).toEqual({long: 1440, short: 1000});
  });
});
