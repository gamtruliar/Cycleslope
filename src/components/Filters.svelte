<script lang="ts">
  import { onMount } from 'svelte';
  import SuitabilityBadge from './SuitabilityBadge.svelte';
  import type { SuitabilityLevel } from '../i18n';
  import { t } from '../i18n';
  import {
    distanceRange,
    difficultyFilter,
    gradientRange,
    searchQuery,
  } from '../lib/filters';
  import {
    filteredSlopes,
    formatDistance,
    formatElevation,
    formatFtpRatio,
    formatGradient,
    formatPower,
    formatDuration,
    loadSlopes,
    slopeError,
    slopeLoadState,
    slopes,
  } from '../lib/slopes';

  interface DifficultyOption {
    level: SuitabilityLevel;
    label: string;
  }

  const slopesCsvUrl = `${import.meta.env.BASE_URL}data/slopes.csv`;
  const difficultyOrder: SuitabilityLevel[] = ['Friendly', 'Challenging', 'Brutal'];

  onMount(() => {
    loadSlopes().catch((error) => {
      console.error('Failed to load slopes dataset', error);
    });
  });

  $: query = $searchQuery;
  $: difficultyOptions = ($t.filters.difficultyOptions as DifficultyOption[]).sort(
    (a, b) => difficultyOrder.indexOf(a.level) - difficultyOrder.indexOf(b.level),
  );
  $: activeDifficulties = new Set($difficultyFilter);
  $: filtered = $filteredSlopes;
  $: totalAvailable = $slopes.length;
  $: showNoMatches =
    $slopeLoadState === 'ready' &&
    totalAvailable > 0 &&
    (query.trim() || activeDifficulties.size > 0) &&
    filtered.length === 0;

  const handleSearchInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    searchQuery.set(target.value);
  };

  const handleDifficultyToggle = (level: SuitabilityLevel) => {
    difficultyFilter.toggle(level);
  };

  const handleGradientMinInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    gradientRange.setMin(target.valueAsNumber);
  };

  const handleGradientMaxInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    gradientRange.setMax(target.valueAsNumber);
  };

  const handleDistanceMinInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    distanceRange.setMin(target.valueAsNumber);
  };

  const handleDistanceMaxInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    distanceRange.setMax(target.valueAsNumber);
  };

  const clearSearch = () => {
    searchQuery.reset();
  };

  const resetFilters = () => {
    searchQuery.reset();
    difficultyFilter.clear();
    gradientRange.reset();
    distanceRange.reset();
  };

  const handleRetry = () => {
    loadSlopes(true).catch((error) => {
      console.error('Failed to reload slopes dataset', error);
    });
  };
</script>

<section id="filters" class="filters glass">
  <header>
    <div>
      <p class="eyebrow">{$t.filters.eyebrow}</p>
      <h2>{$t.filters.title}</h2>
    </div>
    <div class="filters__actions">
      <button type="button" class="reset" on:click={resetFilters}>{$t.filters.reset}</button>
      <a class="download" href={slopesCsvUrl} download>{$t.slopes.cta}</a>
    </div>
  </header>
  <div class="filters__layout">
    <div class="filters__controls">
      <div class="filter-group">
        <label for="filter-search">{$t.filters.searchLabel}</label>
        <div class="input-group">
          <span>🔍</span>
          <input
            id="filter-search"
            type="text"
            placeholder={$t.filters.searchPlaceholder}
            value={query}
            on:input={handleSearchInput}
          />
          {#if query}
            <button type="button" class="clear" on:click={clearSearch}>
              {$t.filters.clearSearch}
            </button>
          {/if}
        </div>
      </div>
      <div class="filter-group">
        <p class="field-label" id="difficulty-label">{$t.filters.difficultyLabel}</p>
        <div class="pill-group" role="group" aria-labelledby="difficulty-label">
          {#each difficultyOptions as option}
            <button
              type="button"
              class:active={activeDifficulties.has(option.level)}
              on:click={() => handleDifficultyToggle(option.level)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>
      <div class="filter-group">
        <p class="field-label">{$t.filters.gradientLabel}</p>
        <div class="range-inputs">
          <label>
            <span>{$t.filters.gradientRange.min}</span>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={$gradientRange.min}
              on:input={handleGradientMinInput}
            />
            <span class="value">{formatGradient($gradientRange.min)}</span>
          </label>
          <label>
            <span>{$t.filters.gradientRange.max}</span>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={$gradientRange.max}
              on:input={handleGradientMaxInput}
            />
            <span class="value">{formatGradient($gradientRange.max)}</span>
          </label>
        </div>
      </div>
      <div class="filter-group">
        <p class="field-label">{$t.filters.distanceLabel}</p>
        <div class="range-inputs">
          <label>
            <span>{$t.filters.distanceRange.min}</span>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={$distanceRange.min}
              on:input={handleDistanceMinInput}
            />
            <span class="value">{formatDistance($distanceRange.min)}</span>
          </label>
          <label>
            <span>{$t.filters.distanceRange.max}</span>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={$distanceRange.max}
              on:input={handleDistanceMaxInput}
            />
            <span class="value">{formatDistance($distanceRange.max)}</span>
          </label>
        </div>
      </div>
      <p class="filters__note">{$t.filters.note}</p>
    </div>
    <div class="filters__results">
      <div id="slopes" class="filters__anchor" aria-hidden="true"></div>
      <div class="results__status">
        {#if $slopeLoadState === 'loading'}
          <span>{$t.slopes.loading}</span>
        {:else if $slopeLoadState === 'error'}
          <div>
            <span>{$t.slopes.error}</span>
            {#if $slopeError}
              <span class="status__detail">{$slopeError}</span>
            {/if}
            <button type="button" class="retry" on:click={handleRetry}>{$t.slopes.retry}</button>
          </div>
        {:else if totalAvailable === 0}
          <span>{$t.slopes.empty}</span>
        {:else if showNoMatches}
          <div>
            <span>{$t.slopes.noMatches.replace('{query}', query.trim())}</span>
            <button type="button" class="retry" on:click={resetFilters}>{$t.filters.reset}</button>
          </div>
        {:else}
          <span>
            {$t.slopes.summary
              .replace('{visible}', String(filtered.length))
              .replace('{total}', String(totalAvailable))}
          </span>
        {/if}
      </div>
      {#if $slopeLoadState === 'error'}
        <div class="slope-placeholder">
          <p>{$t.slopes.error}</p>
          {#if $slopeError}
            <span class="status__detail">{$slopeError}</span>
          {/if}
          <button type="button" class="retry" on:click={handleRetry}>{$t.slopes.retry}</button>
        </div>
      {:else if $slopeLoadState !== 'ready'}
        <div class="slope-placeholder">
          <p>{$t.slopes.placeholder}</p>
        </div>
      {:else if filtered.length === 0}
        <div class="slope-placeholder">
          <p>
            {#if showNoMatches}
              {$t.slopes.noMatches.replace('{query}', query.trim())}
            {:else}
              {$t.slopes.empty}
            {/if}
          </p>
          {#if showNoMatches}
            <button type="button" class="retry" on:click={resetFilters}>{$t.filters.reset}</button>
          {/if}
        </div>
      {:else}
        <ul class="slope-list">
          {#each filtered as row}
            <li class="slope-card">
              <div class="slope-card__header">
                <div>
                  <p class="caption">{$t.slopes.caption}</p>
                  <h3>{row.name}</h3>
                  <p class="location">
                    {row.location} · {$t.slopes.columns.ascent}: {formatElevation(row.totalAscent)}
                  </p>
                </div>
                <SuitabilityBadge level={row.suitability} />
              </div>
              <div class="slope-card__metrics">
                <div class="metric">
                  <span class="metric__label">{$t.slopes.columns.distance}</span>
                  <span class="metric__value">{formatDistance(row.distanceKm)}</span>
                </div>
                <div class="metric">
                  <span class="metric__label">{$t.slopes.columns.gradient}</span>
                  <span class="metric__value">{formatGradient(row.avgGradient)}</span>
                  <span class="metric__detail">
                    {$t.slopes.labels.maxGradient.replace('{value}', formatGradient(row.maxGradient))}
                  </span>
                </div>
                <div class="metric">
                  <span class="metric__label">{$t.slopes.labels.estimatedTime}</span>
                  <span class="metric__value">{formatDuration(row.metrics.climbTimeSeconds)}</span>
                </div>
                <div class="metric">
                  <span class="metric__label">{$t.slopes.columns.power}</span>
                  <span class="metric__value">{formatPower(row.metrics.averagePowerWatts)}</span>
                  <span class="metric__detail">{formatFtpRatio(row.metrics.ftpRatio)}</span>
                </div>
              </div>
              {#if row.burstWarning}
                <p class="burst">{$t.slopes.burstWarning}</p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</section>

<style>
  .filters {
    margin: 3rem auto;
    padding: 2.5rem;
    border-radius: 20px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
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
    margin: 0.6rem 0 0;
    font-size: 1.65rem;
  }

  .filters__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .filters__layout {
    display: grid;
    grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
    gap: 2rem;
  }

  .filters__controls {
    display: grid;
    gap: 1.5rem;
  }

  .filters__results {
    display: grid;
    gap: 1rem;
  }

  .filters__anchor {
    position: relative;
    top: -4rem;
    height: 0;
  }

  .filter-group {
    display: grid;
    gap: 0.85rem;
  }

  label,
  .field-label {
    font-weight: 600;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: white;
    border-radius: 14px;
    padding: 0.85rem 1rem;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  }

  input[type='text'] {
    border: none;
    flex: 1;
    background: transparent;
    font-size: 1rem;
    color: #0f172a;
  }

  input::placeholder {
    color: #94a3b8;
  }

  .clear,
  .reset,
  .retry {
    border: none;
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.45rem 1rem;
    border-radius: 999px;
  }

  .reset {
    background: rgba(15, 23, 42, 0.08);
    color: #0f172a;
  }

  .pill-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .pill-group button {
    border: none;
    padding: 0.45rem 1rem;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.2);
    color: #475569;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .pill-group .active {
    background: rgba(37, 99, 235, 0.15);
    color: #1d4ed8;
  }

  .range-inputs {
    display: grid;
    gap: 1rem;
  }

  .range-inputs label {
    display: grid;
    gap: 0.5rem;
  }

  input[type='range'] {
    accent-color: #2563eb;
  }

  .value {
    font-size: 0.9rem;
    color: #475569;
  }

  .filters__note {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.5;
  }

  .results__status {
    background: rgba(37, 99, 235, 0.08);
    padding: 0.75rem 1rem;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .status__detail {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
  }

  .slope-placeholder {
    width: 100%;
    padding: 2rem;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.05);
    text-align: center;
    color: #475569;
    display: grid;
    gap: 0.75rem;
  }

  .slope-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1.25rem;
  }

  .slope-card {
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 18px;
    background: white;
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
  }

  .slope-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .slope-card__header h3 {
    margin: 0.2rem 0 0.35rem;
    font-size: 1.2rem;
  }

  .caption {
    margin: 0;
    color: #94a3b8;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .location {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  .slope-card__metrics {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.75rem;
    border-radius: 12px;
    background: rgba(148, 163, 184, 0.12);
  }

  .metric__label {
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
  }

  .metric__value {
    font-weight: 600;
    color: #0f172a;
  }

  .metric__detail {
    font-size: 0.8rem;
    color: #475569;
  }

  .burst {
    margin: 0;
    font-size: 0.8rem;
    color: #b91c1c;
    font-weight: 600;
  }

  .download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: rgba(37, 99, 235, 0.15);
    color: #1d4ed8;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }

  @media (max-width: 1024px) {
    .filters__layout {
      grid-template-columns: 1fr;
    }

    .filters__anchor {
      top: -3rem;
    }
  }

  @media (max-width: 640px) {
    header {
      flex-direction: column;
      align-items: stretch;
    }

    .filters__actions {
      justify-content: flex-start;
    }
  }
</style>
