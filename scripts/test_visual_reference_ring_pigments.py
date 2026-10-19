"""Native screenshot pigment guard must reject a dropped GPU ring layer."""
import importlib.util
from pathlib import Path
import unittest

from PIL import Image, ImageDraw

SCRIPT = Path(__file__).with_name("check-painted-ring-pigments.py")
spec = importlib.util.spec_from_file_location("ring_pigments", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec is not None and spec.loader is not None
spec.loader.exec_module(module)


def fixture(missing=None):
    img = Image.new("RGB", (1536, 864), (124, 86, 51))
    draw = ImageDraw.Draw(img)
    colors = [
        (233, 52, 61), (249, 112, 30), (252, 198, 32),
        (75, 175, 88), (40, 139, 245), (77, 83, 220), (142, 66, 205),
    ]
    bands = [(350, 299), (297, 254), (253, 201), (198, 153),
             (151, 104), (103, 66), (65, 19)]
    for (color, (outer, inner), (name, *_)) in zip(colors, bands, module.BANDS):
        for radius, tone in ((outer, (124, 86, 51)),
                             (outer - 1, (124, 86, 51))):
            pass
        x, y = module.CENTER_X, module.CENTER_Y
        ellipse = lambda r: (x - module.PROJECTION_X * r,
                             y - module.PROJECTION_Y * r,
                             x + module.PROJECTION_X * r,
                             y + module.PROJECTION_Y * r)
        draw.ellipse(ellipse(outer), fill=color if name != missing else (124, 86, 51))
        draw.ellipse(ellipse(inner), fill=(124, 86, 51))
    return img


class PigmentLayerGuardTests(unittest.TestCase):
    def test_all_seven_spokes_have_visible_pigment(self):
        scores = module.ring_pigment_fractions(fixture())
        self.assertEqual(set(scores), {b[0] for b in module.BANDS})
        self.assertTrue(all(v > module.MIN_PASS_FRACTION for v in scores.values()), scores)

    def test_missing_blue_ring_fails_pigment_guard(self):
        scores = module.ring_pigment_fractions(fixture(missing="blue"))
        self.assertLess(scores["blue"], module.MIN_PASS_FRACTION)
        self.assertGreater(scores["indigo"], module.MIN_PASS_FRACTION)

    def test_mismatched_size_is_rejected(self):
        with self.assertRaises(ValueError):
            module.ring_pigment_fractions(Image.new("RGB", (568, 320)))


if __name__ == "__main__":
    unittest.main()
