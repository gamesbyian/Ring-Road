#!/usr/bin/env python3
"""Unit tests for diagnostic multi-ray report: no real puzzle-state claims."""
import colorsys
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from PIL import Image, ImageDraw

_PATH = Path(__file__).with_name("visual-reference-compare.py")
_SPEC = importlib.util.spec_from_file_location("visual_reference_compare", _PATH)
_MODULE = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_MODULE)


def synthetic_bands(shift=0, missing=None):
    image = Image.new("RGB", (1536, 864), (45, 45, 45))
    draw = ImageDraw.Draw(image)
    for index, (name, hue) in enumerate(_MODULE._RING_HUES):
        if name == missing:
            continue
        rgb = tuple(round(channel * 255) for channel in
                    colorsys.hsv_to_rgb(hue / 360, 0.95, 0.95))
        left = 450 + index * 44 + shift
        draw.rectangle((left, 345, left + 23, 440), fill=rgb)
    return image


class MultiRayDiagnosticTests(unittest.TestCase):
    def test_identical_source_and_capture_have_zero_deltas(self):
        image = synthetic_bands()
        report = _MODULE.multi_ray_ring_material(image, image)
        self.assertEqual(len(report["rays"]), 5)
        for item in report["aggregate"]:
            self.assertEqual(item["valid_rays"], 5)
            self.assertEqual(item["median_width_delta_px"], 0)
            self.assertEqual(item["max_abs_width_delta_px"], 0)
            self.assertEqual(item["median_left_edge_shift_px"], 0)

    def test_shifted_capture_preserves_width_and_reports_edge_movement(self):
        report = _MODULE.multi_ray_ring_material(synthetic_bands(), synthetic_bands(shift=3))
        for item in report["aggregate"]:
            self.assertEqual(item["valid_rays"], 5)
            self.assertEqual(item["median_width_delta_px"], 0)
            self.assertEqual(item["median_left_edge_shift_px"], 3)

    def test_missing_material_remains_explicit_unknown(self):
        report = _MODULE.multi_ray_ring_material(
            synthetic_bands(), synthetic_bands(missing="blue"))
        blue = next(item for item in report["aggregate"] if item["color"] == "blue")
        self.assertEqual(blue["valid_rays"], 0)
        self.assertIsNone(blue["median_width_delta_px"])
        self.assertIsNone(blue["max_abs_left_edge_shift_px"])
        self.assertTrue(all(
            next(b for b in ray["bands"] if b["color"] == "blue")["actual"] is None
            for ray in report["rays"]
        ))

    def test_unregistered_sizes_rejected(self):
        with self.assertRaises(ValueError):
            _MODULE.multi_ray_ring_material(Image.new("RGB", (1440, 1000)),
                                             Image.new("RGB", (1440, 1000)))


class GenuinePoseContactSheetTests(unittest.TestCase):
    def setUp(self):
        module_path = Path(__file__).with_name("painted-pose-review.py")
        spec = importlib.util.spec_from_file_location("painted_pose_review", module_path)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)

    def test_distinct_real_size_inputs_form_saved_four_panel_sheet(self):
        images = [Image.new("RGB", (1536, 864), color)
                  for color in ("#101020", "#202030", "#303040", "#404050")]
        with TemporaryDirectory() as temp:
            output = Path(temp) / "board-multipose-contact.png"
            self.module.make_review_sheet(images[0], images[1:], output)
            with Image.open(output) as sheet:
                self.assertEqual(sheet.size, (1532, 1166))

    def test_identical_live_states_cannot_masquerade_as_distinct_poses(self):
        reference = Image.new("RGB", (1536, 864), "white")
        live = Image.new("RGB", (1536, 864), "purple")
        with TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError, "pixel-identical"):
                self.module.make_review_sheet(
                    reference, [live, live.copy(), live.copy()],
                    Path(temp) / "invalid.png")


if __name__ == "__main__":
    unittest.main()
