<script lang="ts">
  import SuitabilityBadge from './SuitabilityBadge.svelte';

  const sampleRows = [
    {
      name: 'Tai Mo Shan Access Road',
      location: 'Tsuen Wan',
      distance: '5.6 km',
      gradient: '9.5%',
      suitability: 'Challenging' as const,
    },
    {
      name: 'Fei Ngo Shan',
      location: 'Kowloon',
      distance: '3.8 km',
      gradient: '10.2%',
      suitability: 'Brutal' as const,
    },
    {
      name: 'Mount Parker Road',
      location: 'Quarry Bay',
      distance: '4.0 km',
      gradient: '8.1%',
      suitability: 'Friendly' as const,
    },
  ];
</script>

<section id="slopes" class="slopes glass">
  <header>
    <div>
      <p class="eyebrow">Climb directory</p>
      <h2>Preview the upcoming catalogue.</h2>
    </div>
    <button>Download CSV</button>
  </header>

  <table>
    <thead>
      <tr>
        <th>Climb</th>
        <th>District</th>
        <th>Distance</th>
        <th>Avg. gradient</th>
        <th>Suitability</th>
      </tr>
    </thead>
    <tbody>
      {#each sampleRows as row}
        <tr>
          <td>
            <strong>{row.name}</strong>
            <span class="caption">Featured climb</span>
          </td>
          <td>{row.location}</td>
          <td>{row.distance}</td>
          <td>{row.gradient}</td>
          <td><SuitabilityBadge level={row.suitability} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
  <footer>
    <p>Sorting, filtering, and pagination will be enabled once data integration lands.</p>
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

  button {
    border: none;
    background: rgba(37, 99, 235, 0.15);
    color: #1d4ed8;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
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
