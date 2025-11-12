<section id="filters" class="filters glass">
  <header>
    <p class="eyebrow">Filters</p>
    <h2>Find the climb that matches your mood.</h2>
  </header>
  <div class="filters__grid">
    <div class="filter-group">
      <label>Search climbs</label>
      <div class="input-group">
        <span>🔍</span>
        <input type="text" placeholder="Type a climb or district" disabled />
      </div>
    </div>
    <div class="filter-group">
      <label>Difficulty focus</label>
      <div class="pill-group">
        <button>Beginner</button>
        <button class="active">Progression</button>
        <button>Advanced</button>
      </div>
    </div>
    <div class="filter-group">
      <label>Gradient</label>
      <div class="range-preview">
        <div class="range-track">
          <div class="range-fill"></div>
        </div>
        <div class="range-values">
          <span>0%</span>
          <span>12%</span>
        </div>
      </div>
    </div>
    <div class="filter-group">
      <label>Distance</label>
      <div class="chip-row">
        <span class="chip">Short <strong>&lt; 3 km</strong></span>
        <span class="chip">Medium <strong>3-6 km</strong></span>
        <span class="chip">Long <strong>&gt; 6 km</strong></span>
      </div>
    </div>
  </div>
  <p class="filters__note">Interactive controls will be wired up once the dataset plumbing is complete.</p>
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

  label {
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

  input {
    border: none;
    flex: 1;
    background: transparent;
    font-size: 1rem;
    color: #0f172a;
  }

  input:disabled {
    color: #94a3b8;
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
