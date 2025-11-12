<section id="map" class="map glass">
  <header>
    <p class="eyebrow">Map preview</p>
    <h2>Visualise climb locations.</h2>
  </header>
  <div class="map__canvas">
    <div class="map__grid">
      <div class="map__pin map__pin--one">
        <span>📍</span>
        <p>Tai Mo Shan</p>
      </div>
      <div class="map__pin map__pin--two">
        <span>📍</span>
        <p>Fei Ngo Shan</p>
      </div>
      <div class="map__pin map__pin--three">
        <span>📍</span>
        <p>Mount Parker</p>
      </div>
    </div>
    <p class="map__caption">Leaflet and real map tiles will replace this placeholder in the production build.</p>
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

  .map__grid {
    display: grid;
    place-items: center;
    height: 320px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
    background-size: 48px 48px;
    border-radius: 14px;
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
</style>
