# Hong Kong Cycling Slopes Info Hub — Technical Specification

## 1. Product Vision & Scope

A static, frontend-only web application hosted on GitHub Pages that aggregates Hong Kong cycling slope data and helps riders gauge climb suitability based on personal power and drivetrain settings. No backend services are required.

### Core Use Cases

1. Browse an interactive list of Hong Kong slopes with sorting, filtering, and keyword search (optional map view).
2. Input rider-specific parameters (FTP, gearing, wheel size, cadence, etc.) to classify slopes into suitability buckets.
3. Load slope data from `public/data/slopes.csv`, validate it, and convert the dataset into typed objects on startup.

## 2. Technology Choices

| Category            | Recommendation                              | Notes |
|--------------------|----------------------------------------------|-------|
| Framework           | Svelte + Vite + TypeScript                   | Fast builds and a minimal runtime footprint. |
| Styling             | Tailwind CSS (or Pico.css CDN fallback)      | Enables rapid UI iteration with minimal custom CSS. |
| CSV Parsing         | d3-dsv (`csvParse`) or PapaParse             | Handles CSV ingestion with UTF-8 encoding. |
| Validation          | Zod                                         | Guarantees schema compliance and throws readable errors. |
| State Persistence   | `localStorage`                              | Stores rider profile settings locally. |
| Mapping (optional)  | Leaflet + OpenStreetMap tiles                | Adds geospatial context without API keys. |
| Testing             | Vitest                                      | Unit tests for calculations, parsing, and validation. |
| CI/CD               | GitHub Actions → GitHub Pages                | Automates build and deployment pipeline. |

## 3. Architecture & Directory Layout

```
/public
  /data/slopes.csv         # Source dataset
  /icons/*                 # Optional icon assets
  /og/*                    # Open Graph images
/src
  main.js                  # Vite entry point
  App.svelte               # Root component
  lib/
    csv.ts                 # CSV loading and Zod validation
    model.ts               # Power model & suitability algorithm
    storage.ts             # localStorage helpers
    units.ts               # Unit conversion utilities
  components/
    Filters.svelte
    UserProfile.svelte
    SlopeTable.svelte
    SuitabilityBadge.svelte
    MapView.svelte         # Lazy-loaded optional view
  styles/
    base.css               # Tailwind layer entry
vite.config.ts             # Contains `base: '/hk-slopes/'`
tailwind.config.js
```

## 4. Data Model

### CSV Schema (`public/data/slopes.csv`)

| Column            | Type                  | Description |
|-------------------|-----------------------|-------------|
| `id`              | string (unique)       | Primary identifier, e.g. `TMS_MacLehose_S14`. |
| `name`            | string                | Traditional Chinese slope name. |
| `area`            | string                | Region label (e.g., `新界西`, `港島北`). |
| `start_lat`       | number (WGS84)        | Latitude of the start point. |
| `start_lng`       | number (WGS84)        | Longitude of the start point. |
| `end_lat`         | number (WGS84)        | Latitude of the end point. |
| `end_lng`         | number (WGS84)        | Longitude of the end point. |
| `length_km`       | number                | Total climb length in kilometres. |
| `elev_gain_m`     | number                | Total elevation gain in metres. |
| `avg_grade_pct`   | number                | Average gradient percentage. |
| `max_grade_pct`   | number                | Maximum gradient percentage. |
| `surface`         | enum                  | One of `asphalt`, `concrete`, `mixed`. |
| `traffic`         | enum                  | One of `low`, `medium`, `high`. |
| `notes`           | string (optional)     | Free-text notes. |

### TypeScript Interfaces

```ts
export interface Slope {
  id: string
  name: string
  area: string
  start_lat: number
  start_lng: number
  end_lat: number
  end_lng: number
  length_km: number
  elev_gain_m: number
  avg_grade_pct: number
  max_grade_pct: number
  surface: 'asphalt' | 'concrete' | 'mixed'
  traffic: 'low' | 'medium' | 'high'
  notes?: string
}

export interface UserProfile {
  ftp: number
  massKg: number
  frontMin: number
  rearMax: number
  wheelCircumferenceM: number
  minCadence: number
  cda: number
  crr: number
  airDensity: number
}

export type Suitability = 'easy' | 'hard' | 'nope'
```

## 5. User Input Model

* **FTP (W):** Default 200 W, allowed range 50–500.
* **Mass (kg):** Combined rider and bike weight, default 80 kg.
* **Lowest gear:** Minimal chainring / maximal sprocket (e.g., 34 / 32).
* **Wheel size:** Accept direct circumference (preferred), diameter presets, or manual entry.
* **Minimum cadence:** Default 60 rpm (adjustable 50–80 rpm).
* **Advanced parameters (collapsed by default):** `CdA`, `Crr`, air density.

Persist user preferences inside `localStorage['hk-slopes:user']` as a JSON payload matching `UserProfile`.

## 6. Calculation Logic

### 6.1 Low-speed capability

```
ratio_low = frontMin / rearMax
C = wheelCircumferenceM
v_min = cad_min * ratio_low * C / 60    // metres per second
v_floor = 0.7 m/s (~2.5 km/h)
v = max(v_min, v_floor)
```

### 6.2 Power model

Constants: `g = 9.80665`.

```
m = massKg
grade = avg_grade_pct / 100
F_rr = Crr * m * g
F_g = m * g * grade
F_a = 0.5 * rho * CdA * v^2
P_req = (F_rr + F_g) * v + F_a * v
```

### 6.3 Suitability thresholds

```
if (P_req <= 0.85 * FTP) tag = 'easy'
else if (P_req <= 1.05 * FTP) tag = 'hard'
else tag = 'nope'
```

**Burst check:** recompute `P_peak` using `max_grade_pct`. Flag if `P_peak > 1.2 * FTP`.

### 6.4 Time estimate

```
time_sec = length_km * 1000 / v
```

### 6.5 Output payload

```
{
  tag: Suitability,
  reason: string,
  t_est_sec: number,
  burst: boolean
}
```

## 7. UI & UX Considerations

* **Header:** Site title + GitHub repository link.
* **Controls:** Filters and rider profile inputs in a responsive layout (collapsible on mobile).
* **Data table:** Columns for name, area, length, elevation gain, average/max gradient, suitability badge, estimated time, notes.
* **Suitability badges:**
  * Easy — green
  * Hard — orange
  * Not recommended — red
* **Error handling:** Display inline validation messages for invalid inputs; show descriptive CSV load errors.
* **Internationalisation:** Default to Traditional Chinese copy, centralise strings in `src/i18n.ts` with optional English placeholders.
* **Accessibility:** Semantic table markup (`<th scope="col">`), labelled icons, sufficient colour contrast.

## 8. Performance & Compatibility

* Treat the app as a single-page application.
* Keep `slopes.csv` under ~1 MB (several hundred entries).
* Lazy-load `MapView` to optimise initial bundle size.
* Target evergreen browsers released within the last two years; prioritise mobile responsiveness.

## 9. Deployment Pipeline

* Vite configuration must set `base: '/hk-slopes/'`.
* GitHub Actions workflow (`.github/workflows/pages.yml`) should:
  1. Use Node.js 20.
  2. Install dependencies, run tests, and build the project.
  3. Upload `dist/` as a GitHub Pages artifact.
* Enable GitHub Pages in repository settings with the GitHub Actions source.

## 10. Error Handling Strategy

* **CSV errors:** Show “Failed to load data” and surface Zod error details (row/field).
* **User input errors:** Highlight affected fields and present inline explanations.
* **Map loading failure:** Fall back to list view.

## 11. Testing Strategy (Vitest)

* `units.ts`: unit conversions (mm ↔ m, km/h ↔ m/s).
* `model.ts`: low-speed calculation, power requirements, suitability classification boundaries.
* `csv.ts`: schema validation, missing column/type mismatch handling.
* Optional Playwright smoke test for CSV loading and badge updates.

## 12. Data Governance

* Update `slopes.csv` via pull requests only.
* Automated checks should include CSV schema validation and unit tests.
* Maintain backward compatibility if new columns are added (treat them as optional in consumers).

## 13. Privacy & Compliance

* No backend or user accounts; all profile data remains in `localStorage`.
* Optional analytics should use privacy-friendly tooling (e.g., Plausible or Umami) and default to off.
* When using map tiles, comply with OpenStreetMap or tile provider attribution requirements.

## 14. Risk Mitigation

* **Missing gradient profiles:** Use average and max gradient as initial approximation; consider GPX support later.
* **Wheel size inaccuracies:** Allow direct circumference input and preset options for common wheel sizes.
* **FTP variability:** Communicate that estimates are approximations subject to rider condition.
* **Aerodynamic variability:** Provide quick presets (folding bike vs. road bike) and expose advanced fields for manual tuning.

## 15. Milestones

* **MVP (1–2 dev days):** CSV ingestion, table view, rider inputs, suitability badges, localStorage persistence, basic filters/sorting, time estimate.
* **M1:** Map view, burst power warnings, CI/CD automation.
* **M2:** GPX/Polyline support, richer analytics, e2e testing, English localisation.

