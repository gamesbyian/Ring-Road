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
  // 2026-10-19 multi-ray optical trial: the source orange material reads
  // ~4px narrower and yellow ~6px wider than the live C-rings across five
  // native unobstructed-left transects. Shift only their shared boundary
  // by 5 local sprite pixels, preserving their 1px recessed groove.
  { outer: 297, inner: 254 },
  { outer: 253, inner: 201 },
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
 * Bilinear, premultiplied-alpha image-space remap. Pure pixels so a fixture
 * can verify output against the original implementation without a browser.
 *
 * Runtime geometry and numerical sampling are unchanged. Pixel visits outside
 * the destination annulus never allocate or compute square roots. Inside it,
 * scalar weights/offsets replace the old per-pixel weights[]/neighbors[] arrays
 * (millions of transient JS allocations across seven 900px sprites).
 */
export function warpRingPixels(source: Uint8ClampedArray, artIndex: number): Uint8ClampedArray {
  const size = PAINTED_RING_CANVAS;
  if (source.length !== size * size * 4) {
    throw new RangeError("Invalid painted source texture size");
  }
  const center = (size - 1) / 2;
  const result = new Uint8ClampedArray(size * size * 4);
  const band = REFERENCE_PAINTED_BANDS[artIndex];
  if (!band) throw new RangeError("Invalid painted art ring");
  const innerSquared = band.inner * band.inner;
  const outerSquared = band.outer * band.outer;
  const original = ORIGINAL_PAINTED_BANDS[artIndex]!;
  const radiusScale = (original.outer - original.inner) / (band.outer - band.inner);
  const bound = Math.ceil(band.outer + 1);
  const low = Math.max(0, Math.floor(center - bound));
  const high = Math.min(size - 1, Math.ceil(center + bound));
  const stride = size * 4;

  for (let y = low; y <= high; y++) {
    const dy = y - center;
    const dySquared = dy * dy;
    for (let x = low; x <= high; x++) {
      const dx = x - center;
      const squared = dx * dx + dySquared;
      if (squared < innerSquared || squared > outerSquared) continue;
      // Match the historical radial map's order of arithmetic, while skipping
      // its bounds checks at each valid pixel.
      const radius = Math.hypot(dx, dy);
      const sampleRadius = original.inner + (radius - band.inner) * radiusScale;
      const factor = sampleRadius / radius;
      const sx = center + dx * factor;
      const sy = center + dy * factor;
      const x0 = Math.max(0, Math.min(size - 2, Math.floor(sx)));
      const y0 = Math.max(0, Math.min(size - 2, Math.floor(sy)));
      const fx = sx - x0, fy = sy - y0;
      const a = (1 - fx) * (1 - fy);
      const b = fx * (1 - fy);
      const c = (1 - fx) * fy;
      const d = fx * fy;
      const p00 = y0 * stride + x0 * 4;
      const p01 = p00 + 4;
      const p10 = p00 + stride;
      const p11 = p10 + 4;
      const w00 = source[p00 + 3]! * a;
      const w01 = source[p01 + 3]! * b;
      const w10 = source[p10 + 3]! * c;
      const w11 = source[p11 + 3]! * d;
      const alpha = w00 + w01 + w10 + w11;
      if (alpha < 0.1) continue;
      const out = y * stride + x * 4;
      result[out] = (
        source[p00]! * w00 + source[p01]! * w01 +
        source[p10]! * w10 + source[p11]! * w11
      ) / alpha;
      result[out + 1] = (
        source[p00 + 1]! * w00 + source[p01 + 1]! * w01 +
        source[p10 + 1]! * w10 + source[p11 + 1]! * w11
      ) / alpha;
      result[out + 2] = (
        source[p00 + 2]! * w00 + source[p01 + 2]! * w01 +
        source[p10 + 2]! * w10 + source[p11 + 2]! * w11
      ) / alpha;
      result[out + 3] = alpha;
    }
  }
  return result;
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
  const warped = new ImageData(warpRingPixels(bytes.data, index), PAINTED_RING_CANVAS, PAINTED_RING_CANVAS);
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
