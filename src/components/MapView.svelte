<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { t } from '../i18n';
  import { loadPaths, pathError, pathLoadState, pathsByGroup } from '../lib/paths';

  const routeColors = ['#38bdf8', '#6366f1', '#f97316', '#22c55e', '#facc15', '#ec4899'];
  const defaultCenter: [number, number] = [22.372, 114.177];

  let mapContainer: HTMLDivElement | null = null;
  let map: any = null;
  let routeLayer: any = null;
  let leaflet: any = null;
  let leafletReady = false;
  let leafletLoadPromise: Promise<any> | null = null;

  onMount(() => {
    let cancelled = false;

    loadPaths().catch((error) => {
      console.error('Failed to load path dataset', error);
    });

    ensureLeaflet()
      .then((L) => {
        if (cancelled) {
          return;
        }

        leaflet = L;
        if (!mapContainer) {
          return;
        }

        map = L.map(mapContainer, {
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        map.setView(defaultCenter, 11);
        leafletReady = true;
      })
      .catch((error) => {
        console.error('Failed to initialise Leaflet map', error);
      });

    return () => {
      cancelled = true;
    };
  });

  onDestroy(() => {
    if (routeLayer && map) {
      routeLayer.removeFrom(map);
      routeLayer = null;
    }

    if (map) {
      map.remove();
      map = null;
    }
  });

  $: groupEntries = Object.entries($pathsByGroup);
  $: groupCount = groupEntries.length;
  $: pointCount = groupEntries.reduce((total, [, points]) => total + points.length, 0);
  $: summaryText = $t.map.dataset.summary
    .replace('{groups}', String(groupCount))
    .replace('{points}', String(pointCount));

  $: if (leafletReady && map && leaflet) {
    if ($pathLoadState === 'ready' && groupCount > 0) {
      updateRoutes(groupEntries);
    } else if ($pathLoadState !== 'loading') {
      clearRoutes();
      map.setView(defaultCenter, 11);
    }
  }

  function ensureLeaflet(): Promise<any> {
    if (leafletLoadPromise) {
      return leafletLoadPromise;
    }

    leafletLoadPromise = (async () => {
      if (typeof window === 'undefined') {
        throw new Error('Leaflet can only be loaded in the browser');
      }

      if ((window as any).L) {
        return (window as any).L;
      }

      await Promise.all([injectStylesheet(), injectScript()]);

      const L = (window as any).L;
      if (!L) {
        throw new Error('Leaflet failed to load');
      }
      return L;
    })();

    return leafletLoadPromise;
  }

  function injectStylesheet(): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    if (document.querySelector('link[data-leaflet-css="true"]')) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leafletCss = 'true';
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Failed to load Leaflet stylesheet'));
      document.head.appendChild(link);
    });
  }

  function injectScript(): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    const existing = document.querySelector('script[data-leaflet-script="true"]');
    if (existing) {
      if ((window as any).L) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Leaflet script')));
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.defer = true;
      script.dataset.leafletScript = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet script'));
      document.body.appendChild(script);
    });
  }

  function updateRoutes(entries: [string, { lat: number; lng: number }[]][]) {
    if (!leaflet || !map) {
      return;
    }

    clearRoutes();

    if (!entries.length) {
      return;
    }

    const bounds = leaflet.latLngBounds([]);
    routeLayer = leaflet.layerGroup();

    entries.forEach(([groupId, points], index) => {
      if (points.length === 0) {
        return;
      }

      const color = routeColors[index % routeColors.length];
      const latLngs = points.map((point) => leaflet.latLng(point.lat, point.lng));
      const polyline = leaflet.polyline(latLngs, {
        color,
        weight: 4,
        opacity: 0.9,
        lineJoin: 'round',
      });
      routeLayer.addLayer(polyline);

      const start = latLngs[0];
      const end = latLngs[latLngs.length - 1];

      const startMarker = leaflet.circleMarker(start, {
        radius: 5,
        color,
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2,
      });
      startMarker.bindTooltip(groupId, { direction: 'top', offset: [0, -8], permanent: false });
      routeLayer.addLayer(startMarker);

      const endMarker = leaflet.circleMarker(end, {
        radius: 4,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1,
      });
      routeLayer.addLayer(endMarker);

      latLngs.forEach((latLng: any) => bounds.extend(latLng));
    });

    routeLayer.addTo(map);

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.1));
    } else {
      map.setView(defaultCenter, 11);
    }
  }

  function clearRoutes() {
    if (routeLayer && map) {
      routeLayer.removeFrom(map);
    }
    routeLayer = null;
  }

  const handleRetry = () => {
    loadPaths(true).catch((error) => {
      console.error('Failed to reload path dataset', error);
    });
  };
</script>

<section id="map" class="map glass">
  <header>
    <p class="eyebrow">{$t.map.eyebrow}</p>
    <h2>{$t.map.title}</h2>
  </header>
  <div class="map__canvas">
    <div class="map__container">
      <div bind:this={mapContainer} class="map__leaflet" role="presentation"></div>
      {#if !leafletReady || $pathLoadState !== 'ready' || groupCount === 0}
        <div class="map__overlay">
          <div class="map__overlay-grid">
            {#each $t.map.pins as pin, index}
              <div class={`map__pin map__pin--${index + 1}`}>
                <span>📍</span>
                <p>{pin}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    <p class="map__caption">{$t.map.caption}</p>
    <div class="map__status">
      {#if $pathLoadState === 'loading'}
        <span>{$t.map.dataset.loading}</span>
      {:else if $pathLoadState === 'error'}
        <span>{$t.map.dataset.error}</span>
        {#if $pathError}
          <span class="map__status-detail">{$pathError}</span>
        {/if}
        <button type="button" on:click={handleRetry}>{$t.map.dataset.retry}</button>
      {:else if groupCount > 0}
        <span>{summaryText}</span>
      {:else}
        <span>{$t.map.dataset.loading}</span>
      {/if}
    </div>
  </div>
</section>

<style>
  .map {
    margin: 3rem auto 4rem;
    padding: 2.5rem;
    border-radius: 20px;
  }

  header {
    margin-bottom: 2rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  h2 {
    margin: 0.5rem 0 0;
  }

  .map__canvas {
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(37, 99, 235, 0.15));
    padding: 2rem;
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 1.25rem;
  }

  .map__container {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    min-height: 360px;
    background: rgba(15, 23, 42, 0.05);
  }

  .map__leaflet {
    position: absolute;
    inset: 0;
  }

  :global(.leaflet-container) {
    width: 100%;
    height: 100%;
    font-family: inherit;
  }

  .map__overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(226, 232, 240, 0.85));
    padding: 1.5rem;
  }

  .map__overlay-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .map__pin {
    display: grid;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: white;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
    text-align: center;
  }

  .map__pin span {
    font-size: 1.5rem;
  }

  .map__pin p {
    margin: 0;
    font-weight: 600;
    color: #1f2937;
  }

  .map__caption {
    margin: 0;
    color: #1f2937;
    font-size: 0.95rem;
  }

  .map__status {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .map__status button {
    border: none;
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.45rem 1rem;
    border-radius: 999px;
  }

  .map__status-detail {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
  }

  @media (max-width: 640px) {
    .map__canvas {
      padding: 1.5rem;
    }

    .map__container {
      min-height: 300px;
    }
  }
</style>
