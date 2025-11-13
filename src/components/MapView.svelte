<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../i18n';
  import { loadPaths, pathError, pathLoadState, pathsByGroup } from '../lib/paths';

  const pinClasses = ['map__pin--one', 'map__pin--two', 'map__pin--three'];
  const routeColors = ['#38bdf8', '#6366f1', '#f97316', '#22c55e', '#facc15', '#ec4899'];

  onMount(() => {
    loadPaths().catch((error) => {
      console.error('Failed to load path dataset', error);
    });
  });

  const handleRetry = () => {
    loadPaths(true).catch((error) => {
      console.error('Failed to reload path dataset', error);
    });
  };

  $: groupEntries = Object.entries($pathsByGroup);
  $: groupCount = groupEntries.length;
  $: pointCount = groupEntries.reduce((total, [, points]) => total + points.length, 0);
  $: summaryText = $t.map.dataset.summary
    .replace('{groups}', String(groupCount))
    .replace('{points}', String(pointCount));

  $: bounds = computeBounds(groupEntries);
  $: projectedRoutes = projectRoutes(groupEntries, bounds);

  function computeBounds(entries: [string, { lat: number; lng: number }[]][]) {
    if (!entries.length) {
      return null;
    }

    let minLat = Number.POSITIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    let minLng = Number.POSITIVE_INFINITY;
    let maxLng = Number.NEGATIVE_INFINITY;

    entries.forEach(([, points]) => {
      points.forEach((point) => {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
      });
    });

    if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) {
      return null;
    }

    return { minLat, maxLat, minLng, maxLng };
  }

  function projectRoutes(
    entries: [string, { lat: number; lng: number }[]][],
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null,
  ) {
    if (!bounds) {
      return [];
    }

    const latRange = bounds.maxLat - bounds.minLat || 1;
    const lngRange = bounds.maxLng - bounds.minLng || 1;

    return entries
      .map(([groupId, points], index) => {
        if (points.length === 0) {
          return null;
        }

        const projectedPoints = points.map((point) => ({
          x: ((point.lng - bounds.minLng) / lngRange) * 100,
          y: ((bounds.maxLat - point.lat) / latRange) * 100,
        }));

        const path = projectedPoints.map((point) => `${point.x},${point.y}`).join(' ');
        const start = projectedPoints[0];
        const end = projectedPoints[projectedPoints.length - 1];

        return {
          groupId,
          color: routeColors[index % routeColors.length],
          path,
          start,
          end,
        };
      })
      .filter((value): value is {
        groupId: string;
        color: string;
        path: string;
        start: { x: number; y: number };
        end: { x: number; y: number };
      } => Boolean(value));
  }
</script>

<section id="map" class="map glass">
  <header>
    <p class="eyebrow">{$t.map.eyebrow}</p>
    <h2>{$t.map.title}</h2>
  </header>
  <div class="map__canvas">
    {#if $pathLoadState === 'ready' && projectedRoutes.length > 0}
      <svg class="map__preview" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="presentation">
        <defs>
          <radialGradient id="map-background" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stop-color="rgba(15, 23, 42, 0.1)" />
            <stop offset="100%" stop-color="rgba(15, 23, 42, 0.4)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#map-background)" rx="12" />
        <g class="map__gridlines">
          {#each Array.from({ length: 9 }) as _, index}
            <line x1={(index + 1) * 10} x2={(index + 1) * 10} y1="0" y2="100" />
            <line y1={(index + 1) * 10} y2={(index + 1) * 10} x1="0" x2="100" />
          {/each}
        </g>
        {#each projectedRoutes as route}
          <g class="map__route" style={`--route-color: ${route.color}`}>
            <polyline points={route.path} />
            <circle cx={route.start.x} cy={route.start.y} r="1.2" />
            <circle cx={route.end.x} cy={route.end.y} r="1" class="map__route-end" />
            <text x={route.end.x} y={Math.max(route.end.y - 2, 5)}>{route.groupId}</text>
          </g>
        {/each}
      </svg>
    {:else}
      <div class="map__grid">
        {#each $t.map.pins as pin, index}
          <div class={`map__pin ${pinClasses[index] ?? ''}`}>
            <span>📍</span>
            <p>{pin}</p>
          </div>
        {/each}
      </div>
    {/if}
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
    padding: 2.5rem;
    position: relative;
    overflow: hidden;
  }

  .map__preview {
    display: block;
    width: 100%;
    max-height: 320px;
    border-radius: 14px;
  }

  .map__grid {
    display: grid;
    place-items: center;
    height: 320px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
    background-size: 48px 48px;
    border-radius: 14px;
  }

  .map__gridlines line {
    stroke: rgba(255, 255, 255, 0.12);
    stroke-width: 0.3;
  }

  .map__route polyline {
    fill: none;
    stroke: var(--route-color);
    stroke-width: 1.5;
    stroke-linejoin: round;
    stroke-linecap: round;
    filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.35));
  }

  .map__route circle {
    fill: var(--route-color);
    stroke: rgba(15, 23, 42, 0.6);
    stroke-width: 0.4;
  }

  .map__route-end {
    opacity: 0.85;
  }

  .map__route text {
    fill: rgba(248, 250, 252, 0.9);
    font-size: 4px;
    font-weight: 600;
    text-anchor: middle;
    paint-order: stroke;
    stroke: rgba(15, 23, 42, 0.65);
    stroke-width: 0.6;
  }

  .map__pin {
    background: rgba(15, 23, 42, 0.8);
    color: white;
    padding: 0.8rem 1rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.25);
    display: inline-grid;
    gap: 0.35rem;
  }

  .map__pin span {
    font-size: 1.5rem;
  }

  .map__pin--one {
    justify-self: start;
    align-self: end;
  }

  .map__pin--two {
    justify-self: center;
  }

  .map__pin--three {
    justify-self: end;
    align-self: start;
  }

  .map__caption {
    margin: 1.5rem 0 0;
    text-align: center;
    color: #e2e8f0;
    font-size: 0.9rem;
  }

  .map__status {
    margin: 1rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
    color: #e2e8f0;
    font-size: 0.85rem;
  }

  .map__status-detail {
    color: #cbd5f5;
    font-size: 0.8rem;
  }

  .map__status button {
    align-self: center;
    border: none;
    border-radius: 999px;
    padding: 0.4rem 1rem;
    background: rgba(15, 23, 42, 0.35);
    color: #f8fafc;
    cursor: pointer;
    font-weight: 600;
  }
</style>
