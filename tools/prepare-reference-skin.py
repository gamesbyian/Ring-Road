#!/usr/bin/env python3
"""Stage the user's approved painted Ring Road scenery and experimental ring textures.

No extra Python deps. The two exact user-provided ZIPs are inputs, never fetched
from a network or substituted by a generated stand-in.

  python tools/prepare-reference-skin.py reference-assets.zip calibration.zip

Output is public/reference-skin/, which Vite serves at /Ring-Road/reference-skin/.
The files are NOT already in the repository; this is an explicit handoff/import.
"""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile

SCENERY = [
    "ocean-sky-mountains.webp",
    "castle-waterfalls-terrain.webp",
    "arena-plinth-empty.webp",
    "foreground-stairs-flowers.webp",
]
COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source_zip", type=Path)
    p.add_argument("calibration_zip", type=Path)
    p.add_argument("--output", type=Path, default=Path("public/reference-skin"))
    p.add_argument("--dry-run", action="store_true")
    opt = p.parse_args()
    if not opt.source_zip.is_file() or not opt.calibration_zip.is_file():
        p.error("Both original user ZIP archives are required")
    staged = {}
    with ZipFile(opt.source_zip) as source, ZipFile(opt.calibration_zip) as calibration:
        manifest = json.loads(source.read("asset-manifest.json"))
        if manifest.get("count") != 18 or len(manifest.get("assets", [])) != 18:
            raise ValueError("Original package must contain exactly 18 verified PNGs")
        for item in manifest["assets"]:
            data = source.read(item["repo_source_path"])
            if len(data) != item["source_bytes"] or sha(data) != item["sha256"]:
                raise ValueError("Original artwork checksum mismatch: " + item["slug"])
        for name in SCENERY:
            data = source.read("art-source/ring-road-2026-10-13/optimized/" + name)
            staged[name] = data
        for i, color in enumerate(COLORS, start=1):
            name = "ring-" + str(i) + "-" + color + "-normalized.webp"
            data = calibration.read("ring-road-skin-calibration-2026-10-14/assets/" + name)
            staged[name] = data
    output = opt.output
    if not opt.dry_run:
        output.mkdir(parents=True, exist_ok=True)
    data_manifest = {
        "source_archive": opt.source_zip.name,
        "calibration_archive": opt.calibration_zip.name,
        "source_art_verified": 18,
        "experimental_renderer": True,
        "files": [],
    }
    for filename, data in staged.items():
        item = {"file": filename, "bytes": len(data), "sha256": sha(data)}
        data_manifest["files"].append(item)
        target = output / filename
        if target.is_file() and sha(target.read_bytes()) != sha(data):
            raise ValueError("Refusing to overwrite a different art asset: " + str(target))
        if not opt.dry_run and not target.exists():
            target.write_bytes(data)
    if not opt.dry_run:
        (output / "manifest.json").write_text(json.dumps(data_manifest, indent=2) + "\n")
    total = sum(len(blob) for blob in staged.values())
    print("Verified 18 original PNGs; staged", len(staged), "experimental image assets,",
          f"{total:,} bytes", "at", str(output), "; dry-run:", opt.dry_run)


if __name__ == "__main__":
    main()
