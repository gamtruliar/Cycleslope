import os
import unittest
from pathlib import Path

from tools.gpx_to_csv_tool import compute_statistics, read_paths_csv


class ComputeStatisticsTests(unittest.TestCase):
    def test_max_gradient_monotonic_with_smoothing(self) -> None:
        data_path = Path(__file__).resolve().parents[1] / "public" / "data" / "paths" / "波波.csv"
        points = read_paths_csv(os.fspath(data_path))

        windows = [0, 1, 10, 20, 30]
        gradients = [
            compute_statistics(points, smoothing_points=window, min_seg_m=2.0).max_gradient
            for window in windows
        ]

        for earlier, later in zip(gradients, gradients[1:]):
            self.assertLessEqual(later, earlier, "Max gradient should not increase with larger smoothing windows")


if __name__ == "__main__":
    unittest.main()
