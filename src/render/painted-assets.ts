import { preparePaintedRingTextures } from "./painted-ring-retopology";

/** Browser-side integrity gate for the optional painted renderer.
 * Compile-time list is also an audit contract; a single loaded red ring is not
 * evidence that the complete scene is installed correctly.
 */
export const REQUIRED_PAINTED_ASSETS = [
  "ocean-sky-mountains.webp",
  "castle-waterfalls-terrain.webp",
  "arena-plinth-empty.webp",
  "foreground-stairs-flowers.webp",
  "reference-empty-arena.webp",
  "logo.webp",
  "ring-1-red-normalized.webp",
  "ring-2-orange-normalized.webp",
  "ring-3-yellow-normalized.webp",
  "ring-4-green-normalized.webp",
  "ring-5-blue-normalized.webp",
  "ring-6-indigo-normalized.webp",
  "ring-7-violet-normalized.webp",
  "row-1.webp", "row-2.webp", "row-3.webp", "row-4.webp",
  "row-5.webp", "row-6.webp", "row-7.webp",
] as const;

export interface PaintedAssetManifest {
  source_art_verified: 18;
  ring_notch_corrected: true;
  files: Array<{ file: string; bytes: number; sha256: string }>;
}

export function isCompletePaintedManifest(value: unknown): value is PaintedAssetManifest {
  if (typeof value !== "object" || value === null) return false;
  const manifest = value as Record<string, unknown>;
  if (manifest.source_art_verified !== 18 || manifest.ring_notch_corrected !== true) return false;
  if (!Array.isArray(manifest.files) || manifest.files.length !== REQUIRED_PAINTED_ASSETS.length) return false;
  const names = new Set<string>();
  for (const entry of manifest.files) {
    if (!entry || typeof entry !== "object") return false;
    const record = entry as Record<string, unknown>;
    if (typeof record.file !== "string" || names.has(record.file)) return false;
    if (!Number.isInteger(record.bytes) || (record.bytes as number) <= 0) return false;
    if (typeof record.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(record.sha256)) return false;
    names.add(record.file);
  }
  return REQUIRED_PAINTED_ASSETS.every((file) => names.has(file));
}

/**
 * Fail shut when a reference skin is partially uploaded, corrupt, or not yet
 * deployed. All decoded images are cached and reused by the live React scene.
 * The server-side SHA256/budget script remains authoritative for actual bytes.
 */
export async function paintedAssetsReady(): Promise<boolean> {
  const root = import.meta.env.BASE_URL + "reference-skin/";
  try {
    const response = await fetch(root + "manifest.json", { cache: "no-cache" });
    if (!response.ok || !isCompletePaintedManifest(await response.json())) return false;
    // Keep only the *already loaded* seven originals for retopology; the
    // remaining 13 validated images need no JS object references afterward.
    // Previously each ring was opened again as a new Image() in the warp path,
    // adding seven redundant image/decode lifetimes during mobile startup.
    const loadedRings = new Map<string, HTMLImageElement>();
    await Promise.all(REQUIRED_PAINTED_ASSETS.map((name) => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (name.startsWith("ring-")) loadedRings.set(name, img);
        resolve();
      };
      img.onerror = () => reject(new Error("Reference skin asset failed: " + name));
      img.src = root + name;
    })));
    // Purely visual image-space remap. Source assets remain the fallback.
    // Wait for this to finish before mounting the real painted game scene.
    await preparePaintedRingTextures(root, loadedRings);
    return true;
  } catch {
    return false;
  }
}
