#!/usr/bin/env python3
"""Make an auditable source + actual-state board contact sheet from real Chrome PNGs.

No sprite synthesis, normalization or pose approximation. The reference is one
authored pose, so only its STATIC material/geometry is comparable with others.
"""
import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REFERENCE_BOX = (443, 153, 1193, 678)
CAPTURES = (
    ("Source: one authored pose", "source"),
    ("Live: untouched initial puzzle", "initial"),
    ("Live: physical red-ring step", "red-one-step"),
    ("Live: real 11-move aligned pre-fire", "exact-aligned-pre-fire"),
)


def make_review_sheet(reference, images, output):
    sources = [reference, *images]
    if any(image.size != (1536, 864) for image in sources):
        raise ValueError("All sources must be 1536x864 native Chrome/reference pixels")
    # Validate true image differences, not merely filenames or screenshot metadata.
    hashes = [hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()
              for image in sources[1:]]
    if len(set(hashes)) != 3:
        raise ValueError("Actual puzzle-state screenshots are missing or pixel-identical")
    width = REFERENCE_BOX[2] - REFERENCE_BOX[0]
    height = REFERENCE_BOX[3] - REFERENCE_BOX[1]
    margin = 16
    header = 42
    sheet = Image.new("RGB", (width * 2 + margin * 3,
                              (height + header) * 2 + margin * 3), "#efe7d7")
    draw = ImageDraw.Draw(sheet)
    for i, ((label, _), image) in enumerate(zip(CAPTURES, sources)):
        col, row = i % 2, i // 2
        x = margin + col * (width + margin)
        y = margin + row * (height + header + margin)
        draw.text((x + 8, y + 11), label, fill="#201e1b", font=ImageFont.load_default())
        sheet.paste(image.convert("RGB").crop(REFERENCE_BOX), (x, y + header))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture-dir", type=Path, required=True)
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    base = args.capture_dir / "game-painted-1536x864"
    with Image.open(args.reference) as ref:
        captures = []
        for suffix in ("", "-red-one-step", "-exact-aligned-pre-fire"):
            with Image.open(str(base) + suffix + ".png") as image:
                captures.append(image.convert("RGB"))
        make_review_sheet(ref.convert("RGB"), captures, args.out)
    print("Authentic board-pose contact sheet:", args.out)


if __name__ == "__main__":
    main()
