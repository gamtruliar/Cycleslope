<script lang="ts">
  import { onMount } from 'svelte';
  import SuitabilityBadge from './SuitabilityBadge.svelte';
  import { t } from '../i18n';
  import {
    formatDistance,
    formatElevation,
    formatGradient,
    loadSlopes,
    slopeError,
    slopeLoadState,
    slopes,
  } from '../lib/slopes';

  const slopesCsvUrl = `${import.meta.env.BASE_URL}data/slopes.csv`;

  onMount(() => {
    loadSlopes().catch((error) => {
      console.error('Failed to load slopes dataset', error);
    });
  });

  const handleRetry = () => {
    loadSlopes(true).catch((error) => {
      console.error('Failed to reload slopes dataset', error);
    });
  };
</script>

<section id="slopes" class="slopes glass">
  <header>
    <div>
      <p class="eyebrow">{$t.slopes.eyebrow}</p>
      <h2>{$t.slopes.title}</h2>
    </div>
    <a class="download" href={slopesCsvUrl} download>{$t.slopes.cta}</a>
  </header>

  <table>
    <thead>
      <tr>
        <th>{$t.slopes.columns.climb}</th>
        <th>{$t.slopes.columns.district}</th>
        <th>{$t.slopes.columns.distance}</th>
        <th>{$t.slopes.columns.ascent}</th>
        <th>{$t.slopes.columns.gradient}</th>
        <th>{$t.slopes.columns.suitability}</th>
      </tr>
    </thead>
    <tbody>
      {#if $slopeLoadState === 'loading'}
        <tr>
          <td colspan="6" class="table-message">{$t.slopes.loading}</td>
        </tr>
      {:else if $slopeLoadState === 'error'}
        <tr>
          <td colspan="6" class="table-message">
            <span>{$t.slopes.error}</span>
            {#if $slopeError}
              <span class="table-message__detail">{$slopeError}</span>
            {/if}
            <button class="retry" on:click={handleRetry}>{$t.slopes.retry}</button>
          </td>
        </tr>
      {:else if $slopes.length === 0}
        <tr>
          <td colspan="6" class="table-message">{$t.slopes.empty}</td>
        </tr>
      {:else}
        {#each $slopes as row}
          <tr>
            <td>
              <strong>{row.name}</strong>
              <span class="caption">{$t.slopes.caption}</span>
            </td>
            <td>{row.location}</td>
            <td>{formatDistance(row.distanceKm)}</td>
            <td>{formatElevation(row.totalAscent)}</td>
            <td>{formatGradient(row.avgGradient)}</td>
            <td><SuitabilityBadge level={row.suitability} /></td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
  <footer>
    <p>{$t.slopes.footer}</p>
  </footer>
</section>

<style>
  .slopes {
    margin: 3rem auto;
    padding: 2.5rem;
    border-radius: 20px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
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
    transition: background 0.2s ease, color 0.2s ease;
  }

  .download:hover,
  .download:focus-visible {
    background: rgba(37, 99, 235, 0.25);
    color: #1d4ed8;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 16px;
    overflow: hidden;
    background: white;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
  }

  th,
  td {
    text-align: left;
    padding: 1rem 1.25rem;
  }

  thead {
    background: rgba(148, 163, 184, 0.15);
    color: #1e293b;
    font-size: 0.9rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  tbody tr:not(:last-child) {
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }

  .table-message {
    text-align: center;
    padding: 2rem 1.25rem;
    color: #475569;
    display: grid;
    gap: 0.75rem;
    font-size: 0.95rem;
  }

  .table-message__detail {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .retry {
    justify-self: center;
    border: none;
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
  }

  strong {
    display: block;
  }

  .caption {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  footer {
    margin-top: 1.5rem;
    color: #64748b;
    font-size: 0.85rem;
    text-align: center;
  }
</style>
