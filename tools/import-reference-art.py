#!/usr/bin/env python3
"""Import the user's 2026-10-13 Ring Road artwork bundle, verifying every source SHA256.

Examples:
  python tools/import-reference-art.py /path/to/ring-road-reference-assets-2026-10-13.zip
  python tools/import-reference-art.py BUNDLE.zip --destination . --source-masters
  python tools/import-reference-art.py BUNDLE.zip --destination . --dry-run

This script does not touch runtime art or the game's existing renderer. Full original
sources stay separate from optimized/normalized exports until visual approval.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile

COLLECTION = "Ring Road reference reconstruction artwork"
VERSION = "2026-10-13"
DEFAULT_SUBDIR = "artifacts/reference-art-import"


def safe_entry(value: str) -> Path:
    path = Path(value)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise ValueError(f"Unsafe archive entry: {value}")
    return path


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="Original asset bundle ZIP")
    parser.add_argument("--destination", type=Path, default=Path("."), help="Checkout root")
    parser.add_argument("--source-masters", action="store_true", help="Write under art-source/ instead of artifacts/ staging")
    parser.add_argument("--include-trial-webp", action="store_true", help="Stage supplied unapproved WebP exports too")
    parser.add_argument("--dry-run", action="store_true", help="Verify all sources without writing")
    args = parser.parse_args()
    if not args.archive.is_file():
        parser.error(f"Missing bundle: {args.archive}")
    base = args.destination if args.source_masters else args.destination / DEFAULT_SUBDIR

    with ZipFile(args.archive) as archive:
        try:
            manifest = json.loads(archive.read("asset-manifest.json"))
        except KeyError as exc:
            raise ValueError("Missing asset-manifest.json in asset bundle") from exc
        if manifest.get("collection") != COLLECTION or manifest.get("version") != VERSION:
            raise ValueError("Wrong Ring Road asset collection or version")
        assets = manifest.get("assets", [])
        if manifest.get("count") != 18 or len(assets) != 18:
            raise ValueError("Expected exactly 18 original sources (15 modular + 3 references)")
        seen = set()
        written = []
        for item in assets:
            source = safe_entry(item["repo_source_path"])
            if source in seen or source.suffix.lower() != ".png":
                raise ValueError(f"Duplicate or non-PNG original: {source}")
            if not str(source).startswith("art-source/ring-road-2026-10-13/originals/"):
                raise ValueError(f"Unexpected original source location: {source}")
            seen.add(source)
            data = archive.read(str(source))
            if len(data) != item["source_bytes"] or sha(data) != item["sha256"]:
                raise ValueError(f"CHECKSUM MISMATCH: {source}")
            target = base / source
            if target.exists():
                if sha(target.read_bytes()) != sha(data):
                    raise ValueError(f"Existing file differs from approved original: {target}")
            elif not args.dry_run:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
            written.append((str(source), len(data)))
        extra = []
        if args.include_trial_webp:
            prefix = "art-source/ring-road-2026-10-13/optimized/"
            for name in archive.namelist():
                if not name.startswith(prefix) or not name.endswith(".webp"):
                    continue
                safe_entry(name)
                target = base / name
                data = archive.read(name)
                if target.exists() and sha(target.read_bytes()) != sha(data):
                    raise ValueError(f"Existing trial file differs: {target}")
                if not target.exists() and not args.dry_run:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
                extra.append((name, len(data)))
        if not args.dry_run:
            destination_manifest = base / "art-source/ring-road-2026-10-13/asset-manifest.json"
            destination_manifest.parent.mkdir(parents=True, exist_ok=True)
            destination_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Verified {len(written)} original files: {sum(x[1] for x in written):,} bytes. "
          f"Trial WebP files: {len(extra)}; dry run: {args.dry_run}.")
    print("Staged at", base)
    print("NOTICE: trial assets are not yet approved for the production runtime.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError) as exc:
        print(f"Asset import failed: {exc}", file=sys.stderr)
        sys.exit(1)
