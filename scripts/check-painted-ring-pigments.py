#!/usr/bin/env python3
"""Fail if an authentically rendered painted ring vanishes from a native image.

A live Android run has lost entire C-ring layers while the DOM and all source
Image elements remained valid. This guard checks *actual screenshot pixels*
at many separated angular spokes instead of trusting image.decode() alone.
Coordinates are from the registered 1536x864 painted scene, not a fake pose.
A changed puzzle notch may remove a few samples but never most of a ring.
"""
from __future__ import annotations

import argparse
import colorsys
import math

from PIL import Image

CENTER_X = 811
CENTER_Y = 413
PROJECTION_X = 1.027
PROJECTION_Y = 0.733
# Source annuli and expected authored hue families (degrees, saturation).
BANDS = (
    ("red", 324.5, 356, 18, 0.53),
    ("orange", 275.5, 23, 17, 0.69),
    ("yellow", 227.0, 45, 17, 0.64),
    ("green", 175.5, 128, 28, 0.36),
    ("blue", 127.5, 212, 20, 0.60),
    ("indigo", 84.5, 237, 16, 0.48),
    ("violet", 42.0, 275, 34, 0.38),
)
MIN_PASS_FRACTION = 0.60


def ring_pigment_fractions(image: Image.Image) -> dict[str, float]:
    if image.size != (1536, 864):
        raise ValueError(f"Expected registered native 1536x864, got {image.size}")
    pixels = image.convert("RGB").load()
    scores: dict[str, float] = {}
    for name, radius, hue, tolerance, min_saturation in BANDS:
        matches = total = 0
        for angle in range(0, 360, 22):  # 17 distinct spokes
            radians = math.radians(angle)
            for delta in (-3.0, 0.0, 3.0):
                r = radius + delta
                x = round(CENTER_X + PROJECTION_X * r * math.cos(radians))
                y = round(CENTER_Y + PROJECTION_Y * r * math.sin(radians))
                red, green, blue = pixels[x, y]
                actual_hue, saturation, value = colorsys.rgb_to_hsv(
                    red / 255, green / 255, blue / 255,
                )
                deviation = abs(actual_hue * 360 - hue)
                deviation = min(deviation, 360 - deviation)
                total += 1
                if deviation <= tolerance and saturation >= min_saturation and value >= 0.20:
                    matches += 1
        scores[name] = matches / total
    return scores


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", help="Real 1536x864 Chrome painted screenshot PNG")
    args = parser.parse_args()
    with Image.open(args.image) as screenshot:
        scores = ring_pigment_fractions(screenshot)
    for ring, score in scores.items():
        print(f"{ring:>6} visibly painted: {score:.0%}")
    failed = [name for name, score in scores.items() if score < MIN_PASS_FRACTION]
    if failed:
        raise SystemExit("Real screenshot missing source-painted ring pigments: " +
                         ", ".join(failed))


if __name__ == "__main__":
    main()
