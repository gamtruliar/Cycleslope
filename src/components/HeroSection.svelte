<section class="hero glass">
  <div class="hero__content">
    <div class="hero__text">
      <p class="eyebrow">Hong Kong Cycling Slopes Info Hub</p>
      <h1>Plan your next climb with confidence.</h1>
      <p class="lead">
        Explore gradients, compare gearing options, and visualise signature Hong Kong ascents. This static prototype
        outlines the intended layout while data wiring is still in progress.
      </p>
      <div class="hero__actions">
        <button class="primary">Explore sample climbs</button>
        <button class="secondary">Watch overview</button>
      </div>
      <div class="hero__stats">
        <div>
          <p class="stat-value">28</p>
          <p class="stat-label">iconic climbs</p>
        </div>
        <div>
          <p class="stat-value">+12%</p>
          <p class="stat-label">steepest gradient</p>
        </div>
        <div>
          <p class="stat-value">4.8★</p>
          <p class="stat-label">rider feedback</p>
        </div>
      </div>
    </div>
    <div class="hero__visual">
      <div class="hero__card">
        <p class="badge">
          <span>🔥</span>
          Climb spotlight
        </p>
        <h2>Tai Mo Shan Access Road</h2>
        <div class="hero__metrics">
          <div>
            <span class="metric-label">Distance</span>
            <span class="metric-value">5.6 km</span>
          </div>
          <div>
            <span class="metric-label">Avg gradient</span>
            <span class="metric-value">9.5%</span>
          </div>
          <div>
            <span class="metric-label">Est. time</span>
            <span class="metric-value">32 min</span>
          </div>
        </div>
        <div class="hero__chart">
          <div class="chart-line"></div>
          <div class="chart-peak"></div>
          <div class="chart-peak chart-peak--secondary"></div>
        </div>
        <p class="hero__note">Live data and calculations will appear here in the full build.</p>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    margin: 2.5rem auto;
    padding: 2.5rem 3rem;
    display: flex;
    border-radius: 24px;
    background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 60%),
      rgba(255, 255, 255, 0.92);
  }

  .hero__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 3rem;
    align-items: center;
  }

  .eyebrow {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    margin: 0 0 0.75rem;
    color: #2563eb;
  }

  h1 {
    font-size: clamp(2.2rem, 3vw, 3rem);
    margin: 0 0 1rem;
  }

  .lead {
    margin: 0 0 1.75rem;
    color: #475569;
    line-height: 1.6;
  }

  .hero__actions {
    display: flex;
    gap: 0.75rem;
  }

  button {
    border: none;
    padding: 0.65rem 1.4rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  button:hover {
    transform: translateY(-2px);
  }

  .primary {
    background: linear-gradient(135deg, #2563eb, #0ea5e9);
    color: white;
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
  }

  .secondary {
    background: rgba(14, 165, 233, 0.12);
    color: #0f172a;
  }

  .hero__stats {
    margin-top: 2rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(90px, 1fr));
    gap: 1.5rem;
  }

  .stat-value {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 700;
  }

  .stat-label {
    margin: 0;
    color: #64748b;
    font-size: 0.85rem;
  }

  .hero__visual {
    position: relative;
  }

  .hero__card {
    padding: 2rem;
    background: white;
    border-radius: 22px;
    box-shadow: 0 20px 40px rgba(14, 116, 144, 0.18);
    position: relative;
    overflow: hidden;
  }

  .hero__metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(80px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
  }

  .metric-label {
    display: block;
    color: #94a3b8;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-value {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .hero__chart {
    position: relative;
    height: 110px;
    background: linear-gradient(180deg, rgba(14, 165, 233, 0.08), rgba(14, 165, 233, 0));
    border-radius: 16px;
    overflow: hidden;
  }

  .chart-line {
    position: absolute;
    bottom: 16px;
    left: 14px;
    right: 14px;
    height: 2px;
    background: rgba(15, 23, 42, 0.1);
  }

  .chart-peak {
    position: absolute;
    bottom: 16px;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(37, 99, 235, 0.45), transparent 70%);
    transform: rotate(12deg);
  }

  .chart-peak {
    left: 40%;
  }

  .chart-peak--secondary {
    left: 62%;
    transform: rotate(-8deg);
    background: radial-gradient(circle at 30% 30%, rgba(14, 165, 233, 0.4), transparent 70%);
  }

  .hero__note {
    margin-top: 1.5rem;
    color: #64748b;
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    .hero {
      padding: 2rem;
    }

    .hero__stats {
      grid-template-columns: repeat(2, minmax(90px, 1fr));
    }
  }
</style>
