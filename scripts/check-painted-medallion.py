#!/usr/bin/env python3
"""Protect the violet centerpiece in the native 1536x864 painted reference.

The canonical Ring Road painting has a nearly solid violet medallion beneath
the central pearl. Importing a C-ring texture without this centerpiece can
produce a large sandstone hole while passing broad screenshot-error budgets.
Only use this registration-sensitive guard on the exact native composition.
"""
import argparse
from PIL import Image

CENTER = (811, 391)
RADIUS = 50
MIN_VIOLET = 0.70
MAX_SANDSTONE = 0.15


def test(image: Image.Image) -> tuple[float, float]:
    if image.size != (1536, 864):
        raise ValueError(f"Expected native 1536x864 screenshot, got {image.size}")
    pixels = image.convert("RGB").load()
    n = violet = sandstone = 0
    for y in range(CENTER[1] - RADIUS, CENTER[1] + RADIUS):
        for x in range(CENTER[0] - RADIUS, CENTER[0] + RADIUS):
            if (x - CENTER[0]) ** 2 + (y - CENTER[1]) ** 2 >= RADIUS**2:
                continue
            r, g, b = pixels[x, y]
            n += 1
            violet += b > r + 15 and r > g + 15
            sandstone += r > b + 35 and g > b + 10
    return violet / n, sandstone / n


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture", help="Native 1536x864 painted React screenshot")
    args = parser.parse_args()
    with Image.open(args.capture) as img:
        violet, stone = test(img)
    print(f"Violet medallion: {violet:.1%} violet, {stone:.1%} exposed sandstone")
    if violet < MIN_VIOLET or stone > MAX_SANDSTONE:
        raise SystemExit(
            "Painted center regression: restored sandstone crater or missing violet "
            f"medallion (min violet {MIN_VIOLET:.0%}, max sandstone {MAX_SANDSTONE:.0%})"
        )


if __name__ == "__main__":
    main()
