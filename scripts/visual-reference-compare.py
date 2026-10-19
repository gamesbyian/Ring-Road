#!/usr/bin/env python3
"""Offline reference/game image comparator. Requires Pillow; never part of browser runtime."""
import argparse
import colorsys
import json
from statistics import median
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



# Native photo and initial-puzzle screenshot, not a solved-state fixture.
# Scan the left half of the real board, where the canonical and initial live
# poses have no notches. Hue runs measure material geometry, not puzzle state.
_RING_HUES = (
    ("red", 0), ("orange", 26), ("yellow", 51), ("green", 124),
    ("blue", 200), ("indigo", 245), ("violet", 282),
)


def _ring_material_runs(image, y=394, x0=430, x1=817):
    runs = []
    current, first = None, x0
    for x in range(x0, x1 + 1):
        if x == x1:
            color = None
        else:
            r, g, b = image.getpixel((x, y))[:3]
            hue, saturation, brightness = colorsys.rgb_to_hsv(
                r / 255, g / 255, b / 255
            )
            if saturation < .35 or brightness < .30:
                color = None
            else:
                hue *= 360
                color = min(_RING_HUES, key=lambda item:
                    min(abs(hue - item[1]), 360 - abs(hue - item[1])))[0]
        if color == current:
            continue
        if current is not None and x - first >= 8:
            runs.append((current, first, x - 1))
        current, first = color, x
    found = {}
    for name, _ in _RING_HUES:
        options = [(start, end) for color, start, end in runs if color == name]
        if options:
            start, end = max(options, key=lambda item: item[1] - item[0])
            found[name] = {"left": start, "right": end, "width": end - start + 1}
    return found


def native_ring_transect(reference, actual):
    """One measured unobstructed ray; never make gameplay or ship decisions on it."""
    ref, live = _ring_material_runs(reference), _ring_material_runs(actual)
    missing = [name for name, _ in _RING_HUES if name not in ref or name not in live]
    return {
        "probe": {"y": 394, "x0": 430, "x1_exclusive": 817},
        "warning": "Hue-heuristic single-ray initial-puzzle diagnostic; gaps, pose, and global fidelity are not evaluated.",
        "missing_colors": missing,
        "bands": [
            {"color": color, "reference": ref[color], "actual": live[color],
             "width_delta_px": live[color]["width"] - ref[color]["width"],
             "left_edge_shift_px": live[color]["left"] - ref[color]["left"]}
            for color, _ in _RING_HUES if color in ref and color in live
        ],
    }



# Inspect several safe-ish left-half rays, not only the y=394 transect.
# These samples may traverse shadows or pose-dependent notches: keep their
# per-ray misses and raw values visible and NEVER convert them to a ship gate.
_NATIVE_MATERIAL_RAYS = (354, 374, 394, 414, 434)


def multi_ray_ring_material(reference, actual):
    """Source/live pigment geometry on several native, fixed pixel rows.

    Report every raw sample, plus robust median and worst observed discrepancy.
    The existing single-ray diagnostic remains unchanged for continuity.
    """
    if reference.size != (1536, 864) or actual.size != (1536, 864):
        raise ValueError("Multi-ray ring material probe requires native 1536x864")
    samples = []
    for y in _NATIVE_MATERIAL_RAYS:
        ref = _ring_material_runs(reference, y=y)
        live = _ring_material_runs(actual, y=y)
        bands = []
        for name, _ in _RING_HUES:
            source = ref.get(name)
            measured = live.get(name)
            bands.append({
                "color": name,
                "reference": source,
                "actual": measured,
                "width_delta_px": (measured["width"] - source["width"])
                    if source and measured else None,
                "left_edge_shift_px": (measured["left"] - source["left"])
                    if source and measured else None,
            })
        samples.append({"y": y, "bands": bands})
    aggregate = []
    for name, _ in _RING_HUES:
        entries = [band for sample in samples for band in sample["bands"]
                   if band["color"] == name and band["width_delta_px"] is not None]
        widths = [band["width_delta_px"] for band in entries]
        edges = [band["left_edge_shift_px"] for band in entries]
        aggregate.append({
            "color": name,
            "valid_rays": len(widths),
            "total_rays": len(samples),
            "median_width_delta_px": median(widths) if widths else None,
            "max_abs_width_delta_px": max(map(abs, widths)) if widths else None,
            "median_left_edge_shift_px": median(edges) if edges else None,
            "max_abs_left_edge_shift_px": max(map(abs, edges)) if edges else None,
        })
    return {
        "warning": "Hue-based source-vs-live optical sampling, NOT a pose-invariant "
                   "or geometric ground truth. Inspect per-ray bands, lighting, "
                   "real notches and screenshot state before changing art.",
        "source_size": [1536, 864],
        "x0": 430,
        "x1_exclusive": 817,
        "rays": samples,
        "aggregate": aggregate,
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

    if registration == "aspect-matched" and reference_native_size == (1536, 864):
        report["ring_material_transect"] = native_ring_transect(baseline, actual)
        report["ring_material_multi_ray"] = multi_ray_ring_material(baseline, actual)

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
