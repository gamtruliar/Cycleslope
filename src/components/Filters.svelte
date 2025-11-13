<script lang="ts">
  import { t } from '../i18n';
  import { searchQuery } from '../lib/filters';

  let query = '';

  $: query = $searchQuery;

  const handleSearchInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    searchQuery.set(target.value);
  };

  const clearSearch = () => {
    searchQuery.reset();
  };
</script>

<section id="filters" class="filters glass">
  <header>
    <p class="eyebrow">{$t.filters.eyebrow}</p>
    <h2>{$t.filters.title}</h2>
  </header>
  <div class="filters__grid">
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
        {#each $t.filters.difficultyOptions as option, index}
          <button class:active={index === 1}>{option}</button>
        {/each}
      </div>
    </div>
    <div class="filter-group">
      <p class="field-label">{$t.filters.gradientLabel}</p>
      <div class="range-preview">
        <div class="range-track">
          <div class="range-fill"></div>
        </div>
        <div class="range-values">
          <span>{$t.filters.gradientMin}</span>
          <span>{$t.filters.gradientMax}</span>
        </div>
      </div>
    </div>
    <div class="filter-group">
      <p class="field-label">{$t.filters.distanceLabel}</p>
      <div class="chip-row">
        {#each $t.filters.distanceChips as chip}
          <span class="chip">{chip.label} <strong>{chip.detail}</strong></span>
        {/each}
      </div>
    </div>
  </div>
  <p class="filters__note">{$t.filters.note}</p>
</section>

<style>
  .filters {
    margin: 3rem auto;
    padding: 2.25rem 2.5rem;
    border-radius: 20px;
    background: rgba(15, 23, 42, 0.02);
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
    margin: 0.6rem 0 0;
    font-size: 1.65rem;
  }

  .filters__grid {
    display: grid;
    gap: 1.75rem;
  }

  .filter-group {
    display: grid;
    gap: 0.85rem;
  }

  label,
  .field-label {
    font-weight: 600;
  }

  .field-label {
    margin: 0;
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

  input {
    border: none;
    flex: 1;
    background: transparent;
    font-size: 1rem;
    color: #0f172a;
  }

  input::placeholder {
    color: #94a3b8;
  }

  .clear {
    border: none;
    background: transparent;
    color: #2563eb;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.2rem 0;
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
  }

  .pill-group .active {
    background: rgba(37, 99, 235, 0.15);
    color: #1d4ed8;
  }

  .range-preview {
    display: grid;
    gap: 0.6rem;
  }

  .range-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.3);
    overflow: hidden;
  }

  .range-fill {
    width: 65%;
    height: 100%;
    background: linear-gradient(135deg, #22d3ee, #2563eb);
  }

  .range-values {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.85rem;
  }

  .chip-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .chip {
    background: white;
    border-radius: 999px;
    padding: 0.45rem 1rem;
    box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);
    font-size: 0.85rem;
  }

  .chip strong {
    margin-left: 0.25rem;
  }

  .filters__note {
    margin: 2rem 0 0;
    color: #64748b;
    font-size: 0.85rem;
  }
</style>
