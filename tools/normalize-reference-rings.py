#!/usr/bin/env python3
"""Experimental radial retopology of seven user-supplied Ring Road C-ring paintings.

Preserves source-painted texture and transparent gaps while compressing each
annulus into a consistent concentric band. Never replace the live game renderer
until wall perspective, gap/marker semantics, and hit behavior are approved.

Example:
  python tools/normalize-reference-rings.py \
    --originals artifacts/reference-art-import/art-source/ring-road-2026-10-13/originals

Offline developer tool only: Pillow, NumPy, OpenCV; staging output only.
"""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

RING_COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]
# Source C-notch bearings, clockwise from 3 oclock; match painted-geometry.ts.
NATIVE_GAP_DEGREES = [-90, -60, -4, 5, 0, 4, 6]
CANVAS = 900
SOURCE_CENTER = (627.0, 627.0)
SEGMENTS = 1440


def normalize(source: Path, index: int, output: Path) -> dict:
    original = np.asarray(Image.open(source).convert("RGBA"))
    if original.shape != (1254, 1254, 4):
        raise ValueError(f"Unexpected input shape for {source}: {original.shape}")
    opaque = original[:, :, 3]
    thetas = np.linspace(0, 2 * np.pi, SEGMENTS, endpoint=False)
    srcr = np.arange(100, 612, dtype=np.float32)
    inner, outer = [], []
    for theta in thetas:
        x = np.clip(np.rint(SOURCE_CENTER[0] + srcr * np.cos(theta)).astype(np.int32), 0, 1253)
        y = np.clip(np.rint(SOURCE_CENTER[1] + srcr * np.sin(theta)).astype(np.int32), 0, 1253)
        radii = srcr[opaque[y, x] >= 90]
        inner.append(radii.min() if radii.size else np.nan)
        outer.append(radii.max() if radii.size else np.nan)

    inner, outer = np.array(inner, dtype=np.float32), np.array(outer, dtype=np.float32)
    for arr in (inner, outer):
        valid = np.flatnonzero(np.isfinite(arr))
        if not valid.size:
            raise ValueError(f"No usable opaque annulus detected: {source}")
        arr[:] = np.interp(np.arange(SEGMENTS), valid, arr[valid], period=SEGMENTS)

    yy, xx = np.indices((CANVAS, CANVAS), dtype=np.float32)
    dx, dy = xx - (CANVAS - 1) / 2, yy - (CANVAS - 1) / 2
    angle = np.mod(np.arctan2(dy, dx), 2 * np.pi)
    radius = np.hypot(dx, dy)
    index_by_angle = (angle * (SEGMENTS / (2 * np.pi))).astype(np.int32) % SEGMENTS
    outer_radius = 350 - index * 44
    inner_radius = outer_radius - 39 if index < 6 else 26
    fraction = (radius - inner_radius) / (outer_radius - inner_radius)
    sample_radius = inner[index_by_angle] + (outer[index_by_angle] - inner[index_by_angle]) * fraction
    sx = np.asarray(SOURCE_CENTER[0] + sample_radius * np.cos(angle), dtype=np.float32)
    sy = np.asarray(SOURCE_CENTER[1] + sample_radius * np.sin(angle), dtype=np.float32)
    mapped = cv2.remap(original, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    # Exact radial band width, while retaining the original source-notch alpha.
    margin = np.minimum(radius - inner_radius, outer_radius - radius)
    fade = np.clip(margin / 1.5 + .5, 0, 1)
    mapped[:, :, 3] = np.asarray(mapped[:, :, 3].astype(np.float32) * fade, dtype=np.uint8)
    # Native C-ring source images sometimes retain opaque paint over their
    # notch after polar retopology (especially green/violet). Enforce a
    # calibrated 30px tangential opening on every ring.
    native_angle = np.deg2rad(NATIVE_GAP_DEGREES[index])
    delta = np.abs((angle - native_angle + np.pi) % (2 * np.pi) - np.pi)
    half_gap = 15.0 / ((inner_radius + outer_radius) / 2)
    feather = np.clip((delta - half_gap) * ((inner_radius + outer_radius) / 2) + 0.5, 0, 1)
    mapped[:, :, 3] = np.asarray(mapped[:, :, 3].astype(np.float32) * feather, dtype=np.uint8)
    output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mapped, mode="RGBA").save(output, format="WEBP", quality=90, method=6)
    data = output.read_bytes()
    return {
        "ring": index + 1,
        "color": RING_COLORS[index],
        "outer_radius": outer_radius,
        "inner_radius": inner_radius,
        "source": str(source),
        "output": str(output),
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--originals", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("artifacts/reference-art-prepared/rings"))
    opts = parser.parse_args()
    results = []
    for index, color in enumerate(RING_COLORS):
        name = f"ring-{index+1}-{color}"
        source = opts.originals / f"{name}.png"
        if not source.is_file():
            parser.error(f"Missing staged original source: {source}")
        results.append(normalize(source, index, opts.output / f"{name}-normalized.webp"))
    manifest = opts.output / "normalized-ring-manifest.json"
    manifest.write_text(
        json.dumps({"experimental": True, "canvas": [CANVAS, CANVAS], "rings": results}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Normalized seven source-painted rings: {sum(item['bytes'] for item in results):,} WebP bytes.")
    print("WARNING: visual experimental output only; not accepted for production geometry.")


if __name__ == "__main__":
    main()
