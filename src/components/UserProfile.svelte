<section id="profile" class="profile glass">
  <header>
    <p class="eyebrow">Your setup</p>
    <h2>Dial in your current bike and power.</h2>
  </header>
  <div class="profile__grid">
    <div class="profile__card">
      <h3>Bike & drivetrain</h3>
      <ul>
        <li>
          <span class="label">Bike type</span>
          <span class="value">Endurance road</span>
        </li>
        <li>
          <span class="label">Chainring</span>
          <span class="value">50 / 34</span>
        </li>
        <li>
          <span class="label">Cassette</span>
          <span class="value">11 - 34</span>
        </li>
        <li>
          <span class="label">Tyres</span>
          <span class="value">28c tubeless</span>
        </li>
      </ul>
    </div>
    <div class="profile__card">
      <h3>Power profile</h3>
      <ul>
        <li>
          <span class="label">FTP</span>
          <span class="value">240 W</span>
        </li>
        <li>
          <span class="label">Weight</span>
          <span class="value">68 kg</span>
        </li>
        <li>
          <span class="label">W/kg</span>
          <span class="value">3.5</span>
        </li>
        <li>
          <span class="label">Climb style</span>
          <span class="value">Seated diesel</span>
        </li>
      </ul>
    </div>
    <div class="profile__callout">
      <h3>What&apos;s next?</h3>
      <p>
        This card will evolve into an interactive form syncing to <code>localStorage</code>. For now, it demonstrates the
        spatial design and tonal hierarchy planned for the final experience.
      </p>
      <button>Plan a gearing check</button>
    </div>
  </div>
</section>

<style>
  .profile {
    margin: 3rem auto;
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
    margin: 0.6rem 0 0;
    font-size: 1.65rem;
  }

  .profile__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .profile__card {
    padding: 1.75rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
  }

  h3 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    color: #1e293b;
  }

  .label {
    color: #64748b;
  }

  .value {
    font-weight: 600;
  }

  .profile__callout {
    padding: 2rem;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.18));
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
    display: grid;
    gap: 1rem;
  }

  button {
    border: none;
    align-self: start;
    padding: 0.6rem 1.4rem;
    border-radius: 999px;
    background: #2563eb;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }

  code {
    background: rgba(15, 23, 42, 0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 6px;
  }
</style>
