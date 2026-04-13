import os
import unittest


os.environ.setdefault("SDL_VIDEODRIVER", "dummy")

from pyiso.game import main


class SmokeTests(unittest.TestCase):
    def test_headless_main_runs_few_frames(self) -> None:
        exit_code = main(["--headless", "--frames", "3"])
        self.assertEqual(0, exit_code)


if __name__ == "__main__":
    unittest.main()
