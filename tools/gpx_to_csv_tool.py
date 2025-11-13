"""GPX to CSV conversion tool with a simple Tkinter GUI."""
from __future__ import annotations

import csv
import math
import os
import tkinter as tk
from dataclasses import dataclass
from datetime import datetime
from tkinter import filedialog, messagebox, ttk
from typing import Iterable, List, Optional
from xml.etree import ElementTree as ET

ISO_FORMATS = [
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%S.%f%z",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%f",
]


@dataclass
class TrackPoint:
    latitude: float
    longitude: float
    elevation: float
    time: datetime


def parse_iso_datetime(value: str) -> datetime:
    """Parse an ISO formatted string, supporting a trailing Z."""
    value = value.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+0000"
    for fmt in ISO_FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unsupported datetime format: {value}")


def parse_gpx(file_path: str) -> List[TrackPoint]:
    tree = ET.parse(file_path)
    root = tree.getroot()

    namespace = ""
    if root.tag.startswith("{"):
        namespace = root.tag.split("}")[0].strip("{")

    points: List[TrackPoint] = []
    search_expr = f".//{{{namespace}}}trkpt" if namespace else ".//trkpt"

    for point in root.findall(search_expr):
        lat = float(point.attrib["lat"])
        lon = float(point.attrib["lon"])
        ele_elem = point.find(f"{{{namespace}}}ele") if namespace else point.find("ele")
        time_elem = point.find(f"{{{namespace}}}time") if namespace else point.find("time")
        if ele_elem is None or time_elem is None:
            continue
        elevation = float(ele_elem.text)
        time = parse_iso_datetime(time_elem.text)
        points.append(TrackPoint(lat, lon, elevation, time))

    points.sort(key=lambda p: p.time)
    return points


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the Haversine distance in meters between two points."""
    radius = 6_371_000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def filter_points(points: Iterable[TrackPoint], start: Optional[datetime], end: Optional[datetime]) -> List[TrackPoint]:
    filtered: List[TrackPoint] = []
    for point in points:
        if start and point.time < start:
            continue
        if end and point.time > end:
            continue
        filtered.append(point)
    return filtered


def compute_statistics(points: List[TrackPoint]) -> tuple[float, float, float, float]:
    if len(points) < 2:
        return 0.0, 0.0, 0.0, 0.0

    total_distance = 0.0
    horizontal_distance_sum = 0.0
    total_climb = 0.0
    max_grade = 0.0

    for prev, curr in zip(points, points[1:]):
        horiz_distance = haversine_distance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
        elevation_change = curr.elevation - prev.elevation
        if horiz_distance > 0:
            grade = (elevation_change / horiz_distance) * 100
            max_grade = max(max_grade, grade)
            if elevation_change > 0:
                total_climb += elevation_change
            horizontal_distance_sum += horiz_distance
            total_distance += math.sqrt(horiz_distance ** 2 + elevation_change ** 2)
        else:
            if elevation_change > 0:
                total_climb += elevation_change

    horizontal_for_grade = horizontal_distance_sum if horizontal_distance_sum > 0 else total_distance
    avg_grade = (total_climb / horizontal_for_grade * 100) if horizontal_for_grade > 0 else 0.0

    distance_output = horizontal_distance_sum if horizontal_distance_sum > 0 else total_distance
    return distance_output, avg_grade, total_climb, max_grade


def write_slopes_csv(output_dir: str, stats: tuple[float, float, float, float]) -> str:
    file_path = os.path.join(output_dir, "slopes.csv")
    headers = ["距離", "平均坡度", "總爬升", "最大坡度"]
    with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        writer.writerow([f"{stats[0]:.2f}", f"{stats[1]:.2f}", f"{stats[2]:.2f}", f"{stats[3]:.2f}"])
    return file_path


def write_paths_csv(output_dir: str, points: List[TrackPoint]) -> str:
    file_path = os.path.join(output_dir, "paths.csv")
    headers = ["lat", "lng", "ele", "time"]
    with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        for point in points:
            writer.writerow([f"{point.latitude:.6f}", f"{point.longitude:.6f}", f"{point.elevation:.2f}", point.time.isoformat()])
    return file_path


class GPXConverterGUI:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("GPX to CSV Converter")

        main_frame = ttk.Frame(self.root, padding="12 12 12 12")
        main_frame.grid(column=0, row=0, sticky=(tk.N, tk.W, tk.E, tk.S))

        self.gpx_path_var = tk.StringVar()
        self.start_time_var = tk.StringVar()
        self.end_time_var = tk.StringVar()

        ttk.Label(main_frame, text="GPX File:").grid(column=0, row=0, sticky=tk.W)
        gpx_entry = ttk.Entry(main_frame, width=50, textvariable=self.gpx_path_var)
        gpx_entry.grid(column=1, row=0, sticky=(tk.W, tk.E))
        ttk.Button(main_frame, text="Browse", command=self.select_file).grid(column=2, row=0, padx=5)

        ttk.Label(main_frame, text="Start Time (ISO)").grid(column=0, row=1, sticky=tk.W, pady=(10, 0))
        ttk.Entry(main_frame, width=30, textvariable=self.start_time_var).grid(column=1, row=1, sticky=tk.W, pady=(10, 0))

        ttk.Label(main_frame, text="End Time (ISO)").grid(column=0, row=2, sticky=tk.W, pady=(10, 0))
        ttk.Entry(main_frame, width=30, textvariable=self.end_time_var).grid(column=1, row=2, sticky=tk.W, pady=(10, 0))

        ttk.Button(main_frame, text="Convert", command=self.convert).grid(column=1, row=3, pady=(20, 0))

        for child in main_frame.winfo_children():
            child.grid_configure(padx=5, pady=5)

    def select_file(self) -> None:
        file_path = filedialog.askopenfilename(
            title="Select GPX file",
            filetypes=[("GPX files", "*.gpx"), ("All files", "*.*")]
        )
        if file_path:
            self.gpx_path_var.set(file_path)

    def convert(self) -> None:
        gpx_path = self.gpx_path_var.get().strip()
        if not gpx_path:
            messagebox.showerror("Error", "Please select a GPX file.")
            return

        try:
            points = parse_gpx(gpx_path)
        except Exception as exc:  # pylint: disable=broad-except
            messagebox.showerror("Error", f"Failed to parse GPX file: {exc}")
            return

        if not points:
            messagebox.showerror("Error", "No valid track points found in the GPX file.")
            return

        try:
            start_time = parse_iso_datetime(self.start_time_var.get()) if self.start_time_var.get().strip() else None
        except ValueError as exc:
            messagebox.showerror("Error", f"Invalid start time: {exc}")
            return

        try:
            end_time = parse_iso_datetime(self.end_time_var.get()) if self.end_time_var.get().strip() else None
        except ValueError as exc:
            messagebox.showerror("Error", f"Invalid end time: {exc}")
            return

        if start_time and end_time and start_time > end_time:
            messagebox.showerror("Error", "Start time must be before end time.")
            return

        selected_points = filter_points(points, start_time, end_time)
        if not selected_points:
            messagebox.showerror("Error", "No track points found within the specified time range.")
            return

        output_dir = os.path.dirname(os.path.abspath(gpx_path))
        stats = compute_statistics(selected_points)

        slopes_path = write_slopes_csv(output_dir, stats)
        paths_path = write_paths_csv(output_dir, selected_points)

        messagebox.showinfo(
            "Success",
            f"Conversion complete!\nSlopes CSV: {slopes_path}\nPaths CSV: {paths_path}"
        )

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    app = GPXConverterGUI()
    app.run()


if __name__ == "__main__":
    main()
