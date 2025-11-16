import os
import unittest
from pathlib import Path
from datetime import datetime, timedelta, timezone

from tools.gpx_to_csv_tool import TrackPoint, compute_statistics, read_paths_csv


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

    def test_max_gradient_monotonic_for_cantonese_dataset(self) -> None:
        data_path = (
            Path(__file__).resolve().parents[1]
            / "public"
            / "data"
            / "paths"
            / "牛潭尾濾水廠-Out.csv"
        )
        points = read_paths_csv(os.fspath(data_path))

        windows = [0, 1, 10, 20, 30, 50, 100]
        gradients = [
            compute_statistics(points, smoothing_points=window, min_seg_m=2.0).max_gradient
            for window in windows
        ]

        for earlier, later in zip(gradients, gradients[1:]):
            self.assertLessEqual(later, earlier, "Max gradient should not increase with larger smoothing windows")

    def test_smoothing_reduces_total_ascent(self) -> None:
        base_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
        elevations = [0, 10, 0, 10, 0]
        # Approx 11 meters per step ensures we clear the default 1m filter.
        points = [TrackPoint(0.0, i * 0.0001, ele, base_time + timedelta(seconds=i)) for i, ele in enumerate(elevations)]

        raw_stats = compute_statistics(points, smoothing_points=1, min_seg_m=1.0)
        smoothed_stats = compute_statistics(points, smoothing_points=3, min_seg_m=1.0)

        self.assertLess(smoothed_stats.total_ascent_m, raw_stats.total_ascent_m)


if __name__ == "__main__":
    unittest.main()
