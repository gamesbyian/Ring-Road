/**
 * Image-space geometry correction for the opt-in painted scene.
 *
 * The seven checked-in 900px artwork sources preserve their authored texture
 * and physical gaps, but were normalized with overly narrow/offset annuli.
 * Retopologize the pixels ONCE before displaying painted mode. This is an
 * image warp, never a new drawing of colored rings or puzzle state.
 *
 * Targets are measured from an unobstructed native 1536×864 source transect,
 * then converted through the 1.027x horizontal board projection. See
 * reference-diff/ring_material_transect in the 13-viewport CI artifacts.
 */
export const PAINTED_RING_CANVAS = 900;
export interface RadialBand { readonly inner: number; readonly outer: number }
export const ORIGINAL_PAINTED_BANDS: readonly RadialBand[] = Array.from(
  { length: 7 },
  (_, index) => {
    const outer = 350 - index * 44;
    return { outer, inner: outer - (index < 6 ? 39 : 26) };
  },
);
export const REFERENCE_PAINTED_BANDS: readonly RadialBand[] = [
  { outer: 350, inner: 299 },
  { outer: 297, inner: 249 },
  { outer: 248, inner: 201 },
  { outer: 198, inner: 153 },
  { outer: 151, inner: 104 },
  { outer: 103, inner: 66 },
  { outer: 65, inner: 19 },
];

/** Pure invertible monotone transform for each preserved angular ray. */
export function sourceRadiusAt(targetRadius: number, artIndex: number): number | null {
  const src = ORIGINAL_PAINTED_BANDS[artIndex];
  const dst = REFERENCE_PAINTED_BANDS[artIndex];
  if (!src || !dst || !Number.isFinite(targetRadius) ||
      targetRadius < dst.inner || targetRadius > dst.outer) return null;
  return src.inner + (targetRadius - dst.inner) *
    (src.outer - src.inner) / (dst.outer - dst.inner);
}

const names = [
  "ring-1-red-normalized.webp",
  "ring-2-orange-normalized.webp",
  "ring-3-yellow-normalized.webp",
  "ring-4-green-normalized.webp",
  "ring-5-blue-normalized.webp",
  "ring-6-indigo-normalized.webp",
  "ring-7-violet-normalized.webp",
] as const;
const sprites = new Map<string, string>();
let preparing: Promise<void> | undefined;

export function paintedRingSpriteUrl(filename: string, assetRoot: string): string {
  return sprites.get(filename) ?? (assetRoot + filename);
}

/**
 * Source reference: the central violet wheel has an understated engraved
 * eight-point compass star under its pearl. Its former stationary CSS star
 * was hidden by the opaque moving C-ring. Etch the design IN the moving
 * violet paint and never modify alpha, so a real notch stays a real notch.
 *
 * The star's radial silhouette has eight tapered points at 45° increments,
 * with 24px valleys and 48px tips in the 900px source-normalized ring plane.
 * Return pigment contrast only; the original artwork defines geometry.
 */
export function violetStarEtch(radius: number, theta: number): { shade: number; edge: number } {
  if (!Number.isFinite(radius) || !Number.isFinite(theta) || radius < 18 || radius > 50) {
    return { shade: 0, edge: 0 };
  }
  const tipRadius = 36 + 12 * Math.cos(8 * theta);
  const shade = Math.max(0, Math.min(1, (tipRadius - radius) * 1.2));
  const edge = Math.max(0, 1 - Math.abs(tipRadius - radius) / 1.5);
  return { shade: shade * .22, edge: edge * .12 };
}

function engraveVioletStar(bytes: Uint8ClampedArray): void {
  const center = (PAINTED_RING_CANVAS - 1) / 2;
  for (let y = 399; y <= 501; y++) {
    for (let x = 399; x <= 501; x++) {
      const dx = x - center, dy = y - center;
      const {shade, edge} = violetStarEtch(Math.hypot(dx, dy), Math.atan2(dy, dx));
      if (!shade && !edge) continue;
      const offset = (y * PAINTED_RING_CANVAS + x) * 4;
      if (bytes[offset + 3]! < 90) continue; // never paint into a real gap
      bytes[offset] = bytes[offset]! * (1 - shade) + edge * 24;
      bytes[offset + 1] = bytes[offset + 1]! * (1 - shade) + edge * 17;
      bytes[offset + 2] = bytes[offset + 2]! * (1 - shade * .60) + edge * 19;
      // Preserve exact source-alpha notch and per-pixel sidewall geometry.
    }
  }
}

/** Bilinear, alpha-premultiplied texture sampling. Angular coordinate never changes. */
function warpRing(source: Uint8ClampedArray, artIndex: number): ImageData {
  const size = PAINTED_RING_CANVAS;
  const center = (size - 1) / 2;
  const target = new ImageData(size, size);
  const result = target.data;
  const band = REFERENCE_PAINTED_BANDS[artIndex];
  if (!band) throw new RangeError("Invalid painted art ring");
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
  if (artIndex === 6) engraveVioletStar(result);
  return target;
}

function encodedWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result && result.size > 0) resolve(result);
      else reject(new Error("Painted ring texture encoder unavailable"));
    }, "image/webp", 0.92);
  });
}

async function retopologizeRing(root: string, filename: string, index: number): Promise<string> {
  const image = new Image();
  image.src = root + filename;
  await image.decode();
  if (image.naturalWidth !== PAINTED_RING_CANVAS ||
      image.naturalHeight !== PAINTED_RING_CANVAS) {
    throw new Error("Unexpected ring sprite dimensions: " + filename);
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = PAINTED_RING_CANVAS;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  if (!context) throw new Error("Canvas 2D unavailable");
  context.drawImage(image, 0, 0);
  const bytes = context.getImageData(0, 0, PAINTED_RING_CANVAS, PAINTED_RING_CANVAS);
  const warped = warpRing(bytes.data, index);
  context.clearRect(0, 0, PAINTED_RING_CANVAS, PAINTED_RING_CANVAS);
  context.putImageData(warped, 0, 0);
  return URL.createObjectURL(await encodedWebp(canvas));
}

/**
 * Atomic swap to avoid a partially remapped board. If any canvas/codec fails,
 * the manifest-verified original assets still render and remain playable.
 * Sequential encoding keeps peak RAM sane on physically small Android phones.
 */
export function preparePaintedRingTextures(root: string): Promise<void> {
  if (preparing) return preparing;
  preparing = (async () => {
    const pending = new Map<string, string>();
    try {
      for (const [index, filename] of names.entries()) {
        pending.set(filename, await retopologizeRing(root, filename, index));
      }
      for (const [name, url] of pending) sprites.set(name, url);
    } catch (error) {
      for (const url of pending.values()) URL.revokeObjectURL(url);
      console.warn("Painted ring geometry warp unavailable; keeping verified source sprites.", error);
    }
  })();
  return preparing;
}
