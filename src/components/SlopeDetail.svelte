<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../i18n';
  import {
    formatDifficultyScore,
    formatDistance,
    formatElevation,
    formatGradient,
    GRADIENT_THRESHOLDS,
    type EnrichedSlope,
  } from '../lib/slopes';
  import { loadPaths, pathLoadState, pathsByGroup, type PathPoint } from '../lib/paths';

  export let slope: EnrichedSlope;

  const chartWidth = 600;
  const chartHeight = 220;
  const chartPadding = 24;

  onMount(() => {
    loadPaths().catch((error) => {
      console.error('Failed to load path dataset for slope detail', error);
    });
  });

  $: gradientEntries = GRADIENT_THRESHOLDS.map((threshold, index) => {
    const distance = slope.gradientDistances[threshold] ?? 0;
    const nextThreshold = GRADIENT_THRESHOLDS[index + 1];

    return {
      threshold,
      distance,
      label: nextThreshold ? `${threshold}%-${nextThreshold}%` : `>${threshold}%`,
    };
  }).filter((entry) => entry.distance > 0.003);

  $: tagLabels = slope.difficultyTags;

  $: pathGroupId = slope.pathGroupId?.trim() ?? '';
  $: groupPoints = pathGroupId ? $pathsByGroup[pathGroupId] ?? [] : [];
  $: profile = buildProfile(groupPoints);
  $: chartBounds = computeBounds(profile);
  $: areaPath = buildAreaPath(profile, chartBounds);
  $: linePath = buildLinePath(profile, chartBounds);
  $: youtubeId = slope.youtubeLink?.trim() ?? '';
  $: youtubeUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '';
  $: youtubeEmbed = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : '';

  let hoverIndex: number | null = null;
  let chartElement: HTMLDivElement | null = null;

  $: hoveredPoint = hoverIndex != null && profile[hoverIndex] ? profile[hoverIndex] : null;

  function handlePointer(event: PointerEvent | TouchEvent) {
    if (!chartElement || profile.length === 0) {
      return;
    }

    const clientX = 'touches' in event ? event.touches[0]?.clientX : (event as PointerEvent).clientX;
    if (clientX === undefined) {
      return;
    }

    const rect = chartElement.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = rect.width > 0 ? relativeX / rect.width : 0;
    const index = Math.min(profile.length - 1, Math.max(0, Math.round(ratio * (profile.length - 1))));
    hoverIndex = index;
  }

  function clearPointer() {
    hoverIndex = null;
  }

  interface ProfilePoint {
    distanceKm: number;
    elevation: number;
    gradient: number;
  }

  function buildProfile(points: PathPoint[]): ProfilePoint[] {
    if (!points || points.length === 0) {
      return [];
    }

    const result: ProfilePoint[] = [];
    let cumulative = 0;

    for (let i = 0; i < points.length; i += 1) {
      const current = points[i];
      if (i > 0) {
        const prev = points[i - 1];
        const horiz = haversine(prev.lat, prev.lng, current.lat, current.lng);
        cumulative += horiz;
        const gradient = horiz > 0 ? ((current.ele - prev.ele) / horiz) * 100 : 0;
        result.push({ distanceKm: cumulative / 1000, elevation: current.ele, gradient });
      } else {
        result.push({ distanceKm: 0, elevation: current.ele, gradient: 0 });
      }
    }

    return result;
  }

  function computeBounds(profilePoints: ProfilePoint[]) {
    if (!profilePoints.length) {
      return { maxDistance: 0, minElevation: 0, maxElevation: 0 };
    }

    const maxDistance = profilePoints[profilePoints.length - 1].distanceKm;
    let minElevation = Number.POSITIVE_INFINITY;
    let maxElevation = Number.NEGATIVE_INFINITY;

    profilePoints.forEach((point) => {
      minElevation = Math.min(minElevation, point.elevation);
      maxElevation = Math.max(maxElevation, point.elevation);
    });

    if (maxElevation - minElevation < 5) {
      const mid = (maxElevation + minElevation) / 2;
      minElevation = mid - 2.5;
      maxElevation = mid + 2.5;
    }

    return { maxDistance: Math.max(maxDistance, 0.001), minElevation, maxElevation };
  }

  function scaleX(distanceKm: number, bounds: ReturnType<typeof computeBounds>) {
    const usableWidth = chartWidth - chartPadding * 2;
    return chartPadding + (distanceKm / bounds.maxDistance) * usableWidth;
  }

  function scaleY(elevation: number, bounds: ReturnType<typeof computeBounds>) {
    const usableHeight = chartHeight - chartPadding * 2;
    return chartHeight - chartPadding - ((elevation - bounds.minElevation) / (bounds.maxElevation - bounds.minElevation)) * usableHeight;
  }

  function buildLinePath(profilePoints: ProfilePoint[], bounds: ReturnType<typeof computeBounds>): string {
    if (!profilePoints.length) {
      return '';
    }

    return profilePoints
      .map((point, index) => {
        const x = scaleX(point.distanceKm, bounds);
        const y = scaleY(point.elevation, bounds);
        return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' ');
  }

  function buildAreaPath(profilePoints: ProfilePoint[], bounds: ReturnType<typeof computeBounds>): string {
    if (!profilePoints.length) {
      return '';
    }

    const baseline = chartHeight - chartPadding;
    const startX = scaleX(profilePoints[0].distanceKm, bounds);
    const pathSegments = [`M ${startX} ${baseline}`];

    profilePoints.forEach((point) => {
      const x = scaleX(point.distanceKm, bounds);
      const y = scaleY(point.elevation, bounds);
      pathSegments.push(`L ${x} ${y}`);
    });

    const endX = scaleX(profilePoints[profilePoints.length - 1].distanceKm, bounds);
    pathSegments.push(`L ${endX} ${baseline} Z`);
    return pathSegments.join(' ');
  }

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radius = 6_371_000;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radius * c;
  }
</script>

<div class="slope-detail">
  <div class="slope-detail__grid">
    <div class="slope-detail__section">
      <div class="section__title">
        <p>{$t.slopes.detail.gradientTitle}</p>
      </div>
      <div class="chip-row">
        {#if gradientEntries.length > 0}
          {#each gradientEntries as entry}
            <span class="chip">{entry.label} · {formatDistance(entry.distance)}</span>
          {/each}
        {:else}
          <span class="chip chip--muted">{$t.slopes.detail.gradientEmpty}</span>
        {/if}
      </div>
    </div>
    <div class="slope-detail__section">
      <div class="section__title">
        <p>{$t.slopes.detail.tagsTitle}</p>
        <span class="score">{$t.slopes.detail.scoreLabel.replace('{value}', formatDifficultyScore(slope.detailDifficultyScore))}</span>
      </div>
      <div class="chip-row">
        {#if tagLabels.length > 0}
          {#each tagLabels as tag}
            <span class="chip chip--tag">{$t.slopes.detail.tags[tag] ?? tag}</span>
          {/each}
        {:else}
          <span class="chip chip--muted">{$t.slopes.detail.tagsEmpty}</span>
        {/if}
      </div>
    </div>
  </div>
  <div class="slope-detail__profile">
    <div class="profile__header">
      <div>
        <p>{$t.slopes.detail.profileTitle}</p>
        <p class="profile__hint">{$t.slopes.detail.profileHint}</p>
      </div>
      {#if hoveredPoint}
        <div class="profile__readout">
          <span>{formatDistance(hoveredPoint.distanceKm)}</span>
          <span>{formatElevation(hoveredPoint.elevation)}</span>
          <span>{formatGradient(hoveredPoint.gradient)}</span>
        </div>
      {/if}
    </div>
    {#if $pathLoadState === 'loading'}
      <p class="profile__status">{$t.slopes.detail.profileLoading}</p>
    {:else if $pathLoadState === 'error'}
      <p class="profile__status">{$t.slopes.detail.profileError}</p>
    {:else if !pathGroupId}
      <p class="profile__status">{$t.slopes.detail.profileMissing}</p>
    {:else if !profile.length}
      <p class="profile__status">{$t.slopes.detail.profileUnavailable}</p>
    {:else}
      <div
        class="profile__chart"
        bind:this={chartElement}
        on:pointermove={handlePointer}
        on:pointerleave={clearPointer}
        on:touchstart|preventDefault={handlePointer}
        on:touchmove|preventDefault={handlePointer}
        on:touchend={clearPointer}
      >
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={$t.slopes.detail.profileTitle}>
          <path class="profile__area" d={areaPath} />
          <path class="profile__line" d={linePath} />
          {#if hoveredPoint}
            <line
              class="profile__marker"
              x1={scaleX(hoveredPoint.distanceKm, chartBounds)}
              x2={scaleX(hoveredPoint.distanceKm, chartBounds)}
              y1={chartPadding}
              y2={chartHeight - chartPadding}
            />
            <circle
              class="profile__dot"
              cx={scaleX(hoveredPoint.distanceKm, chartBounds)}
              cy={scaleY(hoveredPoint.elevation, chartBounds)}
              r="4"
            />
          {/if}
        </svg>
      </div>
    {/if}
  </div>
  {#if youtubeId}
    <div class="slope-detail__video">
      <div class="section__title">
        <p>{$t.slopes.detail.videoTitle}</p>
        <a href={youtubeUrl} target="_blank" rel="noreferrer">{$t.slopes.detail.videoCta}</a>
      </div>
      <div class="video__frame">
        <iframe
          title={$t.slopes.detail.videoTitle}
          src={`${youtubeEmbed}?rel=0`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  {/if}
</div>

<style>
  .slope-detail {
    margin-top: 1rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(15, 23, 42, 0.12);
    display: grid;
    gap: 1.5rem;
  }

  .slope-detail__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .slope-detail__section {
    display: grid;
    gap: 0.5rem;
  }

  .section__title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }

  .section__title p {
    margin: 0;
    font-weight: 600;
    color: #0f172a;
  }

  .score {
    font-size: 0.85rem;
    color: #64748b;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip {
    border-radius: 999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.85rem;
    background: rgba(37, 99, 235, 0.1);
    color: #1d4ed8;
    white-space: nowrap;
  }

  .chip--tag {
    background: rgba(236, 72, 153, 0.12);
    color: #be185d;
  }

  .chip--muted {
    background: rgba(148, 163, 184, 0.2);
    color: #475569;
  }

  .slope-detail__profile {
    display: grid;
    gap: 0.75rem;
  }

  .slope-detail__video {
    display: grid;
    gap: 0.75rem;
  }

  .profile__header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .profile__header p {
    margin: 0;
  }

  .profile__hint {
    font-size: 0.85rem;
    color: #64748b;
  }

  .profile__readout {
    display: flex;
    gap: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .profile__status {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .profile__chart {
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(37, 99, 235, 0.12));
    padding: 0.5rem;
  }

  svg {
    width: 100%;
    height: auto;
  }

  .video__frame {
    position: relative;
    padding-top: 56.25%;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.08);
  }

  .video__frame iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .profile__area {
    fill: rgba(59, 130, 246, 0.25);
    stroke: none;
  }

  .profile__line {
    fill: none;
    stroke: #2563eb;
    stroke-width: 3;
    stroke-linecap: round;
  }

  .profile__marker {
    stroke: rgba(15, 23, 42, 0.3);
    stroke-dasharray: 4;
  }

  .profile__dot {
    fill: #f59e0b;
    stroke: white;
    stroke-width: 2;
  }

  @media (max-width: 640px) {
    .profile__readout {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
