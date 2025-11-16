"""GPX to CSV conversion tool with a simple Tkinter GUI."""
from __future__ import annotations
import csv
import math
import os
import tkinter as tk
from dataclasses import dataclass
from datetime import datetime, timezone
from tkinter import filedialog, messagebox, ttk
from typing import Dict, Iterable, List, Optional
from xml.etree import ElementTree as ET
ISO_FORMATS = [
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%S.%f%z",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%f",
]
GRADIENT_THRESHOLDS = (3, 5, 7, 10, 13, 17, 20, 25, 30, 40)
GRADIENT_FIELD_NAMES = tuple(f"gradient_{threshold}_distance_km" for threshold in GRADIENT_THRESHOLDS)


@dataclass
class TrackPoint:
    latitude: float
    longitude: float
    elevation: float
    time: datetime


@dataclass
class SlopeStats:
    distance_km: float
    total_ascent_m: float
    avg_gradient: float
    max_gradient: float
    gradient_distances_km: Dict[int, float]
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
def _smooth_elevations(points: List[TrackPoint], window: int) -> List[TrackPoint]:
    """Return a new list with smoothed elevations using a centered moving average.
    window: odd or even accepted; values <=1 return original elevations.
    """
    n = len(points)
    if window is None or window <= 1 or n == 0:
        return [TrackPoint(p.latitude, p.longitude, p.elevation, p.time) for p in points]
    half = window // 2
    smoothed: List[TrackPoint] = []
    for i in range(n):
        start = max(0, i - half)
        end = min(n, i - half + window)  # try to keep approx window size
        if end <= start:
            start = max(0, i)
            end = min(n, i + 1)
        s = 0.0
        cnt = 0
        for j in range(start, end):
            s += points[j].elevation
            cnt += 1
        ele = s / cnt if cnt else points[i].elevation
        smoothed.append(TrackPoint(points[i].latitude, points[i].longitude, ele, points[i].time))
    return smoothed
def compute_statistics(points: List[TrackPoint], smoothing_points: int = 1, min_seg_m: float = 1.0) -> SlopeStats:
    """Compute distance, climbing stats, and gradient distribution."""
    if len(points) < 2:
        return SlopeStats(0.0, 0.0, 0.0, 0.0, {threshold: 0.0 for threshold in GRADIENT_THRESHOLDS})
    pts = _smooth_elevations(points, smoothing_points) if smoothing_points and smoothing_points > 1 else points
    total_distance = 0.0
    horizontal_distance_sum = 0.0
    total_climb = 0.0
    max_grade = 0.0
    gradient_distances = {threshold: 0.0 for threshold in GRADIENT_THRESHOLDS}
    for prev, curr in zip(pts, pts[1:]):
        horiz_distance = haversine_distance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
        elevation_change = curr.elevation - prev.elevation
        if horiz_distance <= 0 or horiz_distance < min_seg_m:
            continue
        grade = (elevation_change / horiz_distance) * 100
        max_grade = max(max_grade, grade)
        if elevation_change > 0:
            total_climb += elevation_change
        horizontal_distance_sum += horiz_distance
        total_distance += math.sqrt(horiz_distance ** 2 + elevation_change ** 2)
        if grade > 0:
            for threshold in GRADIENT_THRESHOLDS:
                if grade >= threshold:
                    gradient_distances[threshold] += horiz_distance
    horizontal_for_grade = horizontal_distance_sum if horizontal_distance_sum > 0 else total_distance
    avg_grade = (total_climb / horizontal_for_grade * 100) if horizontal_for_grade > 0 else 0.0
    distance_output = horizontal_distance_sum if horizontal_distance_sum > 0 else total_distance
    gradient_km = {threshold: value / 1000 for threshold, value in gradient_distances.items()}
    return SlopeStats(distance_output / 1000, total_climb, avg_grade, max_grade, gradient_km)
def write_slopes_csv(output_dir: str, stats: SlopeStats) -> str:
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "slopes.csv")
    headers = [
        "distance_km",
        "total_ascent_m",
        "avg_gradient",
        "max_gradient",
    ]
    headers.extend(GRADIENT_FIELD_NAMES)
    with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        row = [
            f"{stats.distance_km:.2f}",
            f"{stats.total_ascent_m:.2f}",
            f"{stats.avg_gradient:.2f}",
            f"{stats.max_gradient:.2f}",
        ]
        row.extend([f"{stats.gradient_distances_km[threshold]:.2f}" for threshold in GRADIENT_THRESHOLDS])
        writer.writerow(row)
    return file_path
def write_paths_csv(output_dir: str, points: List[TrackPoint]) -> str:
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "paths.csv")
    headers = ["lat", "lng", "ele"]
    with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        for point in points:
            writer.writerow([f"{point.latitude:.6f}", f"{point.longitude:.6f}", f"{point.elevation:.2f}"])
    return file_path
class GPXConverterGUI:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("GPX to CSV Converter")
        main_frame = ttk.Frame(self.root, padding="12 12 12 12")
        main_frame.grid(column=0, row=0, sticky=(tk.N+tk.W+tk.E+tk.S))
        self.gpx_path_var = tk.StringVar()
        self.output_dir_var = tk.StringVar()
        self.start_time_var = tk.StringVar()
        self.end_time_var = tk.StringVar()
        self.smoothing_points_var = tk.IntVar(value=5)  # 1 = off
        # Holds GPX points once a file is chosen
        self.points: List[TrackPoint] = []
        # Internal guard to avoid feedback loops when syncing widget values
        self._syncing = False
        ttk.Label(main_frame, text="GPX File:").grid(column=0, row=0, sticky=tk.W)
        gpx_entry = ttk.Entry(main_frame, width=50, textvariable=self.gpx_path_var)
        gpx_entry.grid(column=1, row=0, sticky=(tk.W+tk.E))
        ttk.Button(main_frame, text="Browse", command=self.select_file).grid(column=2, row=0, padx=5)
        # Output folder selection
        ttk.Label(main_frame, text="Output Folder:").grid(column=0, row=1, sticky=tk.W)
        out_entry = ttk.Entry(main_frame, width=50, textvariable=self.output_dir_var)
        out_entry.grid(column=1, row=1, sticky=(tk.W+tk.E))
        ttk.Button(main_frame, text="Browse", command=self.select_output_dir).grid(column=2, row=1, padx=5)
        ttk.Label(main_frame, text="Start Time (ISO)").grid(column=0, row=2, sticky=tk.W, pady=(10, 0))
        ttk.Entry(main_frame, width=30, textvariable=self.start_time_var).grid(column=1, row=2, sticky=tk.W, pady=(10, 0))
        ttk.Label(main_frame, text="End Time (ISO)").grid(column=0, row=3, sticky=tk.W, pady=(10, 0))
        ttk.Entry(main_frame, width=30, textvariable=self.end_time_var).grid(column=1, row=3, sticky=tk.W, pady=(10, 0))
        # Sliders for selecting start/end by index within the loaded GPX points
        ttk.Label(main_frame, text="Start (slider)").grid(column=0, row=4, sticky=tk.W)
        self.start_index_var = tk.DoubleVar(value=0.0)
        self.start_scale = ttk.Scale(
            main_frame,
            orient="horizontal",
            from_=0.0,
            to=0.0,
            variable=self.start_index_var,
            command=self._on_start_scale_move,
            state="disabled",
            length=300,
        )
        self.start_scale.grid(column=1, row=4, sticky=(tk.W+tk.E))
        ttk.Label(main_frame, text="End (slider)").grid(column=0, row=5, sticky=tk.W)
        self.end_index_var = tk.DoubleVar(value=0.0)
        self.end_scale = ttk.Scale(
            main_frame,
            orient="horizontal",
            from_=0.0,
            to=0.0,
            variable=self.end_index_var,
            command=self._on_end_scale_move,
            state="disabled",
            length=300,
        )
        self.end_scale.grid(column=1, row=5, sticky=(tk.W+tk.E))
        # Smoothing controls
        ttk.Label(main_frame, text="Smoothing window (points)").grid(column=0, row=6, sticky=tk.W)
        tk.Spinbox(main_frame, from_=1, to=201, increment=1, width=8, textvariable=self.smoothing_points_var).grid(column=1, row=6, sticky=tk.W)
        ttk.Button(main_frame, text="Convert", command=self.convert).grid(column=1, row=7, pady=(20, 0))
        for child in main_frame.winfo_children():
            child.grid_configure(padx=5, pady=5)
        # Two-way sync: update sliders when entries change
        self.start_time_var.trace_add("write", self._on_start_entry_changed)
        self.end_time_var.trace_add("write", self._on_end_entry_changed)
    def _to_timestamp(self, dt: datetime) -> float:
        """Convert datetime to POSIX seconds, treating naive as UTC to avoid tz errors."""
        if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    def _find_nearest_index(self, dt: datetime) -> int:
        if not self.points:
            return 0
        target = self._to_timestamp(dt)
        # Linear search is ok for typical GPX sizes; keeps dependencies minimal
        best_i = 0
        best_delta = float("inf")
        for i, p in enumerate(self.points):
            ts = self._to_timestamp(p.time)
            d = abs(ts - target)
            if d < best_delta:
                best_delta = d
                best_i = i
        return best_i
    def _apply_points_to_sliders(self) -> None:
        """Configure and enable sliders based on currently loaded points."""
        if not self.points:
            # disable
            self.start_scale.configure(state="disabled", from_=0.0, to=0.0)
            self.end_scale.configure(state="disabled", from_=0.0, to=0.0)
            self.start_index_var.set(0.0)
            self.end_index_var.set(0.0)
            return
        n = len(self.points)
        self.start_scale.configure(state="normal", from_=0.0, to=float(n - 1))
        self.end_scale.configure(state="normal", from_=0.0, to=float(n - 1))
        # Default to full range
        self._syncing = True
        try:
            self.start_index_var.set(0.0)
            self.end_index_var.set(float(n - 1))
            self.start_time_var.set(self.points[0].time.isoformat())
            self.end_time_var.set(self.points[-1].time.isoformat())
        finally:
            self._syncing = False
    def _on_start_scale_move(self, value: str) -> None:
        if self._syncing or not self.points:
            return
        idx = max(0, min(int(round(float(value))), len(self.points) - 1))
        # Keep start <= end
        if idx > int(round(self.end_index_var.get())):
            self._syncing = True
            try:
                self.end_index_var.set(float(idx))
                self.end_time_var.set(self.points[idx].time.isoformat())
            finally:
                self._syncing = False
        # Update start entry
        self._syncing = True
        try:
            self.start_time_var.set(self.points[idx].time.isoformat())
        finally:
            self._syncing = False
    def _on_end_scale_move(self, value: str) -> None:
        if self._syncing or not self.points:
            return
        idx = max(0, min(int(round(float(value))), len(self.points) - 1))
        # Keep start <= end
        if idx < int(round(self.start_index_var.get())):
            self._syncing = True
            try:
                self.start_index_var.set(float(idx))
                self.start_time_var.set(self.points[idx].time.isoformat())
            finally:
                self._syncing = False
        # Update end entry
        self._syncing = True
        try:
            self.end_time_var.set(self.points[idx].time.isoformat())
        finally:
            self._syncing = False
    def _on_start_entry_changed(self, *_: object) -> None:
        if self._syncing or not self.points:
            return
        txt = self.start_time_var.get().strip()
        if not txt:
            return
        try:
            dt = parse_iso_datetime(txt)
        except ValueError:
            return
        idx = self._find_nearest_index(dt)
        self._syncing = True
        try:
            self.start_index_var.set(float(idx))
        finally:
            self._syncing = False
    def _on_end_entry_changed(self, *_: object) -> None:
        if self._syncing or not self.points:
            return
        txt = self.end_time_var.get().strip()
        if not txt:
            return
        try:
            dt = parse_iso_datetime(txt)
        except ValueError:
            return
        idx = self._find_nearest_index(dt)
        self._syncing = True
        try:
            self.end_index_var.set(float(idx))
        finally:
            self._syncing = False
    def select_file(self) -> None:
        file_path = filedialog.askopenfilename(
            title="Select GPX file",
            filetypes=[("GPX files", "*.gpx"), ("All files", "*.*")]
        )
        if file_path:
            self.gpx_path_var.set(file_path)
            # Set default output folder to GPX directory if empty
            if not self.output_dir_var.get().strip():
                self.output_dir_var.set(os.path.dirname(os.path.abspath(file_path)))
            # Parse immediately to configure sliders
            try:
                pts = parse_gpx(file_path)
            except Exception as exc:  # pylint: disable=broad-except
                messagebox.showerror("Error", f"Failed to parse GPX file: {exc}")
                self.points = []
                self._apply_points_to_sliders()
                return
            self.points = pts
            if not self.points:
                messagebox.showerror("Error", "No valid track points found in the GPX file.")
            self._apply_points_to_sliders()
    def select_output_dir(self) -> None:
        folder = filedialog.askdirectory(title="Select Output Folder")
        if folder:
            self.output_dir_var.set(folder)
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
        # Use chosen output dir or default to GPX dir
        output_dir = self.output_dir_var.get().strip() or os.path.dirname(os.path.abspath(gpx_path))
        smoothing_points = self.smoothing_points_var.get()
        if not isinstance(smoothing_points, int):
            try:
                smoothing_points = int(smoothing_points)
            except Exception:
                smoothing_points = 1
        smoothing_points = max(1, smoothing_points)
        stats = compute_statistics(selected_points, smoothing_points=smoothing_points, min_seg_m=1.0)
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
