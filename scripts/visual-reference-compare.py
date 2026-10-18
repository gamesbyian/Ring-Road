#!/usr/bin/env python3
"""Offline reference/game image comparator. Requires Pillow; never part of browser runtime."""
import argparse
import json
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageStat, ImageDraw
except ImportError as error:
    raise SystemExit("Install the optional art tooling: python -m pip install Pillow") from error


def align_reference(reference, size, mode):
    rw, rh = reference.size
    w, h = size
    if abs(rw / rh - w / h) < 0.003:
        return reference.resize(size, Image.Resampling.LANCZOS), "aspect-matched"
    if mode == "native":
        raise SystemExit(
            f"Aspect mismatch: reference {rw}x{rh}, capture {w}x{h}. "
            "Specify --mode contain or --mode cover for an exploratory visual montage. "
            "Metrics on different compositions are NOT fidelity scores."
        )
    if mode == "contain":
        scaled = ImageOps.contain(reference, size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", size, (45, 40, 45))
        canvas.paste(scaled, ((w - scaled.width) // 2, (h - scaled.height) // 2))
        return canvas, "exploratory-contain"
    return ImageOps.fit(reference, size, Image.Resampling.LANCZOS), "exploratory-cover"


def errors(first, second):
    diff = ImageChops.difference(first.convert("RGB"), second.convert("RGB"))
    gray = diff.convert("L")
    edge_first = first.convert("L").filter(ImageFilter.FIND_EDGES)
    edge_second = second.convert("L").filter(ImageFilter.FIND_EDGES)
    return {
        "mean_rgb_abs_error_0_255": round(sum(ImageStat.Stat(diff).mean) / 3, 3),
        "mean_luma_abs_error_0_255": round(ImageStat.Stat(gray).mean[0], 3),
        "edge_mean_abs_error_0_255": round(
            ImageStat.Stat(ImageChops.difference(edge_first, edge_second)).mean[0], 3
        ),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", required=True, type=Path, help="Approved reference image")
    parser.add_argument("--actual", required=True, type=Path, help="Browser screenshot")
    parser.add_argument("--out", type=Path, default=Path("artifacts/visual-compare"))
    parser.add_argument("--mode", choices=["native", "contain", "cover"], default="native")
    parser.add_argument("--regions", type=Path, default=Path("docs/reference-regions.json"))
    parser.add_argument("--max-rgb-mae", type=float,
                        help="Optional native-ratio visual regression ceiling (0..255). "
                             "Never apply to contain/cover exploratory compositions.")
    args = parser.parse_args()

    reference = Image.open(args.reference).convert("RGB")
    actual = Image.open(args.actual).convert("RGB")
    reference_native_size = reference.size
    baseline, registration = align_reference(reference, actual.size, args.mode)

    args.out.mkdir(parents=True, exist_ok=True)
    difference = ImageChops.difference(baseline, actual)
    overlay = Image.blend(baseline, actual, 0.5)
    heat = ImageOps.colorize(difference.convert("L"), black="#1a233c", white="#fa5039")
    side_by_side = Image.new("RGB", (actual.width * 2, actual.height), "#f5e8c9")
    side_by_side.paste(baseline, (0, 0))
    side_by_side.paste(actual, (actual.width, 0))
    for name, image in [
        ("reference-aligned.png", baseline),
        ("overlay-50.png", overlay),
        ("absolute-difference.png", difference),
        ("heatmap.png", heat),
        ("side-by-side.png", side_by_side),
    ]:
        image.save(args.out / name)

    report = {
        "source_reference": str(args.reference),
        "source_reference_dimensions": list(reference_native_size),
        "actual": str(args.actual),
        "actual_dimensions": list(actual.size),
        "registration": registration,
        "warning": (
            "Composition/aspect ratios differ: visual montage only; pixel scores are NOT "
            "a pass/fail measure of reference fidelity."
            if registration.startswith("exploratory") else
            "Image registration is only size-based; motion/state/lighting differences must be reviewed."
        ),
        "full_image": errors(baseline, actual),
        "regions": [],
    }

    if args.regions.is_file():
        specification = json.loads(args.regions.read_text(encoding="utf8"))
        source_width = specification["reference"]["width"]
        source_height = specification["reference"]["height"]
        if (source_width, source_height) != reference_native_size:
            report["region_warning"] = (
                "Landmark coordinates were authored for a different reference size; "
                "normalized region crops are diagnostic only."
            )
        for region in specification["regions"]:
            x0, y0, x1, y1 = region["box"]
            box = (
                max(0, round(x0 / source_width * actual.width)),
                max(0, round(y0 / source_height * actual.height)),
                min(actual.width, round(x1 / source_width * actual.width)),
                min(actual.height, round(y1 / source_height * actual.height)),
            )
            if box[0] >= box[2] or box[1] >= box[3]:
                continue
            ref_crop = baseline.crop(box)
            actual_crop = actual.crop(box)
            prefix = region["id"]
            ref_crop.save(args.out / f"{prefix}-reference.png")
            actual_crop.save(args.out / f"{prefix}-actual.png")
            report["regions"].append({
                "name": prefix,
                "box_in_capture": list(box),
                **errors(ref_crop, actual_crop),
            })

    (args.out / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps(report, indent=2))
    print(f"Visual artifacts: {args.out}")
    if args.max_rgb_mae is not None:
        if registration != "aspect-matched":
            raise SystemExit("--max-rgb-mae requires an aspect-matched source capture")
        observed = report["full_image"]["mean_rgb_abs_error_0_255"]
        if observed > args.max_rgb_mae:
            raise SystemExit(
                f"REFERENCE VISUAL REGRESSION: mean RGB error {observed:.3f} "
                f"exceeds approved ceiling {args.max_rgb_mae:.3f}. "
                "Inspect screenshots for missing backdrop, wrong pose or layout."
            )
        print(f"Reference visual gate passed: RGB MAE {observed:.3f} <= {args.max_rgb_mae:.3f}")


if __name__ == "__main__":
    main()
