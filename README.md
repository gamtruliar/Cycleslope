# Hong Kong Cycling Slopes Info Hub

Hong Kong Cycling Slopes Info Hub is a static single-page application designed to catalogue steep cycling routes across Hong Kong and to help riders evaluate whether each climb suits their current setup and fitness. The project targets GitHub Pages hosting with zero server-side dependencies.

## Project Goals

* Provide a searchable, filterable list of notable Hong Kong cycling climbs backed by a validated CSV dataset.
* Allow cyclists to input personal power and drivetrain parameters to estimate climb suitability and completion time.
* Keep the codebase lightweight and maintainable by relying on modern frontend tooling only.

## Tech Stack

| Layer            | Choice                                       | Notes |
|-----------------|----------------------------------------------|-------|
| Framework        | [Svelte](https://svelte.dev/) + Vite + TypeScript | Reactive UI without large runtime. |
| Styling          | [Tailwind CSS](https://tailwindcss.com/) (or fallback to [Pico.css](https://picocss.com/)) | Utility-first styling for fast prototyping. |
| Data parsing     | [d3-dsv](https://github.com/d3/d3-dsv) `csvParse` or [PapaParse](https://www.papaparse.com/) | Streaming-friendly CSV parsing. |
| Validation       | [Zod](https://zod.dev/) | Guarantees data integrity at load-time. |
| Storage          | `localStorage` | Persists rider profile on-device. |
| Mapping (optional) | [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles | Lazy-loaded map visualisation with proper attribution. |
| Testing          | [Vitest](https://vitest.dev/) | Unit tests for utilities and core logic. |
| CI/CD            | GitHub Actions → GitHub Pages | Automatic build and deployment. |

## Repository Structure

```
/public
  /data/slopes.csv          # Core dataset
  /icons/*                  # Optional icon set
  /og/*                     # Open Graph assets
/src
  main.ts                   # Application bootstrap
  App.svelte                # Root component
  lib/
    csv.ts                  # CSV loading, validation, typing
    model.ts                # Power model and suitability logic
    storage.ts              # localStorage helpers
    units.ts                # Unit conversion helpers
  components/
    Filters.svelte
    UserProfile.svelte
    SlopeTable.svelte
    SuitabilityBadge.svelte
    MapView.svelte          # Optional map view
  styles/
    base.css                # Tailwind entry point
vite.config.ts              # Vite config (with GitHub Pages base path)
tailwind.config.js
```

## Development Workflow

1. **Seed any offline package archives**
   ```bash
   npm run offline:extract -- @sveltejs_vite-plugin-svelte.json
   ```
   The helper extracts a base64-encoded `.tgz` archive into `offline-packages/`. Pass any additional JSON archives you have on
   disk to the same command to prepare their folders before installing dependencies.
   Each archive JSON must expose a `tarball` (or `dist.tarballBase64`) property containing the base64-encoded tarball payload
   plus at least a `name` and `version` so the helper can organise the output folder.

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. **Execute the test suite**
   ```bash
   npm test
   ```
5. **Build for production**
   ```bash
   npm run build
   ```

## Deployment

* Configure Vite with `base: '/hk-slopes/'` to ensure correct asset paths when served from GitHub Pages.
* Use GitHub Actions (Node 20) to build the site and publish the `dist/` folder to the `gh-pages` branch.
* Enable GitHub Pages in repository settings and point it to the GitHub Actions workflow.

## Data Updates

* The canonical dataset lives at `public/data/slopes.csv`.
* Every update to the CSV should go through a pull request.
* Automated checks must cover CSV schema validation and unit tests before merging.

## License

This project inherits the repository license found in `LICENSE`.
