#!/usr/bin/env python3
"""Identify anonymous user art already uploaded to repository root.

A non-destructive inspection: emit image geometry, representative swatches and
very small JPEG previews in base64 to GitHub Action logs. No source edits.
The previews are for review only; masters remain untouched.
"""
import base64
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageOps

SOURCE = Path(".")
EXPECTED = Path("art-source/ring-road-2026-10-13/originals")
ANON = sorted(SOURCE.glob("file_*.png"))
named = {p.stem: p for p in EXPECTED.glob("*.png")}
known_shas = {hashlib.sha1(b"blob " + str(p.stat().st_size).encode() + b"\0" + p.read_bytes()).hexdigest(): p.name
              for p in EXPECTED.glob("*.png")}

for candidate in ANON:
    raw = candidate.read_bytes()
    sha = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    with Image.open(io.BytesIO(raw)) as img:
        rgba = img.convert("RGBA")
        width, height = img.size
        samples = [rgba.getpixel((x, y)) for x, y in (
            (0, 0), (width // 2, 0), (width - 1, 0),
            (0, height // 2), (width // 2, height // 2), (width - 1, height // 2),
            (0, height - 1), (width // 2, height - 1), (width - 1, height - 1)
        )]
        summary = {
            "name": candidate.name, "sha": sha, "matches": known_shas.get(sha),
            "dimensions": [width, height], "mode": img.mode,
            "pixels": samples, "bytes": len(raw)
        }
        print("RINGROAD_META " + json.dumps(summary, separators=(",", ":")), flush=True)
        if sha not in known_shas:
            thumb = ImageOps.contain(rgba.convert("RGB"), (160, 95), method=Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            thumb.save(buffer, "JPEG", quality=59, optimize=True)
            print("RINGROAD_THUMB " + candidate.name + " " +
                  base64.b64encode(buffer.getvalue()).decode(), flush=True)
