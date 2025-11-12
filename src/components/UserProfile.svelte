<script lang="ts">
  import { t } from '../i18n';
  import { settings, type UserSettings } from '../lib/settings';

  const handleNumberInput = (key: keyof UserSettings) => (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const value = target.valueAsNumber;

    if (Number.isNaN(value)) {
      return;
    }

    settings.updateSetting(key, value);
  };

  const resetSettings = () => {
    settings.reset();
  };
</script>

<section id="profile" class="profile glass">
  <header>
    <p class="eyebrow">{$t.profile.eyebrow}</p>
    <h2>{$t.profile.title}</h2>
  </header>
  <form class="profile__form" on:submit|preventDefault>
    <div class="profile__grid">
      <div class="profile__card">
        <h3>{$t.profile.bike.title}</h3>
        <label class="profile__field">
          <span class="label">{$t.profile.form.frontChainring}</span>
          <input
            type="number"
            min="20"
            max="60"
            step="1"
            value={$settings.frontChainringTeeth}
            on:change={handleNumberInput('frontChainringTeeth')}
          />
        </label>
        <label class="profile__field">
          <span class="label">{$t.profile.form.rearSprocket}</span>
          <input
            type="number"
            min="20"
            max="42"
            step="1"
            value={$settings.rearSprocketTeeth}
            on:change={handleNumberInput('rearSprocketTeeth')}
          />
        </label>
        <label class="profile__field">
          <span class="label">{$t.profile.form.wheelCircumference}</span>
          <input
            type="number"
            min="1800"
            max="2500"
            step="1"
            value={$settings.wheelCircumferenceMm}
            on:change={handleNumberInput('wheelCircumferenceMm')}
          />
        </label>
      </div>
      <div class="profile__card">
        <h3>{$t.profile.power.title}</h3>
        <label class="profile__field">
          <span class="label">{$t.profile.form.ftp}</span>
          <input
            type="number"
            min="50"
            max="500"
            step="1"
            value={$settings.ftp}
            on:change={handleNumberInput('ftp')}
          />
        </label>
        <label class="profile__field">
          <span class="label">{$t.profile.form.mass}</span>
          <input
            type="number"
            min="40"
            max="120"
            step="0.5"
            value={$settings.massKg}
            on:change={handleNumberInput('massKg')}
          />
        </label>
        <label class="profile__field">
          <span class="label">{$t.profile.form.minCadence}</span>
          <input
            type="number"
            min="50"
            max="100"
            step="1"
            value={$settings.minCadence}
            on:change={handleNumberInput('minCadence')}
          />
        </label>
      </div>
      <div class="profile__callout">
        <h3>{$t.profile.callout.title}</h3>
        <p>{$t.profile.callout.body}</p>
        <p class="helper">{$t.profile.form.helper}</p>
        <button type="button" on:click={resetSettings}>{$t.profile.callout.button}</button>
      </div>
    </div>
  </form>
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

  .profile__form {
    margin: 0;
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
    display: grid;
    gap: 1rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
  }

  .profile__field {
    display: grid;
  }

  .label {
    color: #64748b;
    font-size: 0.9rem;
  }

  input {
    margin-top: 0.35rem;
    width: 100%;
    padding: 0.55rem 0.75rem;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: rgba(255, 255, 255, 0.92);
    color: #0f172a;
    font-size: 0.95rem;
  }

  input:focus-visible {
    outline: 2px solid rgba(37, 99, 235, 0.35);
    outline-offset: 2px;
  }

  .profile__callout {
    padding: 2rem;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.18));
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
    display: grid;
    gap: 1.1rem;
  }

  .helper {
    margin: 0;
    color: #1d4ed8;
    font-size: 0.85rem;
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
</style>
