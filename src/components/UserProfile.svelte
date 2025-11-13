<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '../i18n';
  import {
    getTotalSystemMassKg,
    savedProfiles,
    settings,
    type UserSettings,
  } from '../lib/settings';

  const wheelCircumferenceOptions = [
    { value: 2070, label: '700×23c · 2070 mm' },
    { value: 2096, label: '700×25c · 2096 mm' },
    { value: 2105, label: '700×28c · 2105 mm' },
    { value: 2148, label: '29″×2.2 · 2148 mm' },
    { value: 1995, label: '650b×47 · 1995 mm' },
  ];

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

  let profileName = '';
  let selectedProfileId = '';
  let feedback: { type: 'success' | 'error'; text: string } | null = null;
  let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
  let wheelSelection = 'custom';
  let totalMassKg = 0;
  let formattedTotalMass = '';

  const showFeedback = (type: 'success' | 'error', text: string) => {
    feedback = { type, text };
    if (feedbackTimeout) {
      clearTimeout(feedbackTimeout);
    }
    feedbackTimeout = setTimeout(() => {
      feedback = null;
      feedbackTimeout = null;
    }, 4000);
  };

  const handleSaveProfile = () => {
    const trimmed = profileName.trim();
    if (!trimmed) {
      showFeedback('error', $t.profile.savedProfiles.nameRequired);
      return;
    }

    try {
      const saved = savedProfiles.saveProfile(trimmed, $settings);
      profileName = '';
      selectedProfileId = saved.id;
      showFeedback('success', $t.profile.savedProfiles.saved.replace('{name}', saved.name));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showFeedback('error', message);
    }
  };

  const handleLoadProfile = () => {
    if (!selectedProfileId) {
      return;
    }

    const profile = $savedProfiles.find((item) => item.id === selectedProfileId);
    if (!profile) {
      showFeedback('error', $t.profile.savedProfiles.empty);
      return;
    }

    settings.setAll(profile.settings);
    showFeedback('success', $t.profile.savedProfiles.loaded.replace('{name}', profile.name));
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) {
      return;
    }

    const profile = $savedProfiles.find((item) => item.id === selectedProfileId);
    if (!profile) {
      return;
    }

    savedProfiles.deleteProfile(selectedProfileId);
    showFeedback('success', $t.profile.savedProfiles.deleted.replace('{name}', profile.name));
    selectedProfileId = '';
  };

  $: totalMassKg = getTotalSystemMassKg($settings);
  $: formattedTotalMass = formatMass(totalMassKg);
  $: wheelSelection = wheelCircumferenceOptions.some(
    (option) => option.value === $settings.wheelCircumferenceMm,
  )
    ? String($settings.wheelCircumferenceMm)
    : 'custom';

  const handleWheelSelect = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement;
    if (target.value === 'custom') {
      return;
    }

    const parsed = Number(target.value);
    if (Number.isFinite(parsed)) {
      settings.updateSetting('wheelCircumferenceMm', parsed);
    }
  };

  function formatMass(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return rounded.toFixed(1).replace(/\.0$/, '');
  }

  $: if (selectedProfileId && !$savedProfiles.some((profile) => profile.id === selectedProfileId)) {
    selectedProfileId = '';
  }

  onDestroy(() => {
    if (feedbackTimeout) {
      clearTimeout(feedbackTimeout);
    }
  });
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
          <div class="wheel-input">
            <select bind:value={wheelSelection} on:change={handleWheelSelect}>
              {#each wheelCircumferenceOptions as option}
                <option value={String(option.value)}>{option.label}</option>
              {/each}
              <option value="custom">{$t.profile.form.wheelCircumferenceCustom}</option>
            </select>
            <input
              type="number"
              min="1800"
              max="2500"
              step="1"
              value={$settings.wheelCircumferenceMm}
              on:change={handleNumberInput('wheelCircumferenceMm')}
            />
          </div>
          <span class="helper">{$t.profile.form.wheelCircumferenceHelper}</span>
        </label>
      </div>
      <div class="profile__card">
        <h3>{$t.profile.rider.title}</h3>
        <p class="helper">{$t.profile.rider.helper}</p>
        <label class="profile__field">
          <span class="label">{$t.profile.form.riderWeight}</span>
          <input
            type="number"
            min="30"
            max="120"
            step="0.5"
            value={$settings.riderWeightKg}
            on:change={handleNumberInput('riderWeightKg')}
          />
        </label>
        <label class="profile__field">
          <span class="label">{$t.profile.form.bikeWeight}</span>
          <input
            type="number"
            min="5"
            max="25"
            step="0.1"
            value={$settings.bikeWeightKg}
            on:change={handleNumberInput('bikeWeightKg')}
          />
        </label>
        <label class="profile__field">
          <span class="label">{$t.profile.form.cargoWeight}</span>
          <input
            type="number"
            min="0"
            max="25"
            step="0.1"
            value={$settings.cargoWeightKg}
            on:change={handleNumberInput('cargoWeightKg')}
          />
        </label>
        <div class="profile__total-mass">
          <span>{$t.profile.rider.totalMass}</span>
          <strong>{formattedTotalMass} kg</strong>
        </div>
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
        <div class="profile__reset">
          <p class="helper">{$t.profile.form.helper}</p>
          <button type="button" on:click={resetSettings}>{$t.profile.reset}</button>
        </div>
      </div>
    </div>
    <div class="profile__saved">
      <div class="profile__saved-header">
        <h3>{$t.profile.savedProfiles.title}</h3>
        <p>{$t.profile.savedProfiles.subtitle}</p>
      </div>
      <div class="profile__saved-grid">
        <div class="profile__saved-column">
          <label class="profile__field">
            <span class="label">{$t.profile.savedProfiles.nameLabel}</span>
            <div class="profile__saved-input-row">
              <input
                type="text"
                placeholder={$t.profile.savedProfiles.namePlaceholder}
                bind:value={profileName}
              />
              <button type="button" on:click={handleSaveProfile}>{$t.profile.savedProfiles.saveButton}</button>
            </div>
            <span class="helper">{$t.profile.savedProfiles.overwriteHint}</span>
          </label>
        </div>
        <div class="profile__saved-column">
          <label class="profile__field">
            <span class="label">{$t.profile.savedProfiles.selectLabel}</span>
            <select bind:value={selectedProfileId}>
              <option value="">{$t.profile.savedProfiles.selectPlaceholder}</option>
              {#each $savedProfiles as profile}
                <option value={profile.id}>{profile.name}</option>
              {/each}
            </select>
          </label>
          <div class="profile__saved-actions">
            <button type="button" on:click={handleLoadProfile} disabled={!selectedProfileId}>
              {$t.profile.savedProfiles.loadButton}
            </button>
            <button
              type="button"
              class="danger"
              on:click={handleDeleteProfile}
              disabled={!selectedProfileId}
            >
              {$t.profile.savedProfiles.deleteButton}
            </button>
          </div>
        </div>
      </div>
      {#if !$savedProfiles.length}
        <p class="profile__saved-empty">{$t.profile.savedProfiles.empty}</p>
      {/if}
      {#if feedback}
        <p class={`profile__saved-message profile__saved-message--${feedback.type}`} aria-live="polite">
          {feedback.text}
        </p>
      {/if}
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

  select {
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

  select:focus-visible {
    outline: 2px solid rgba(37, 99, 235, 0.35);
    outline-offset: 2px;
  }

  .helper {
    margin: 0;
    color: #1d4ed8;
    font-size: 0.85rem;
  }

  .wheel-input {
    display: grid;
    gap: 0.75rem;
  }

  .profile__total-mass {
    margin-top: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: rgba(37, 99, 235, 0.08);
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 0.95rem;
  }

  .profile__total-mass strong {
    font-size: 1.1rem;
    color: #0f172a;
  }

  .profile__reset {
    display: grid;
    gap: 0.75rem;
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

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .profile__saved {
    margin-top: 2.5rem;
    padding: 2rem;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.04);
    display: grid;
    gap: 1.5rem;
  }

  .profile__saved-header h3 {
    margin: 0;
  }

  .profile__saved-header p {
    margin: 0.5rem 0 0;
    color: #475569;
  }

  .profile__saved-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .profile__saved-column {
    display: grid;
    gap: 1rem;
  }

  .profile__saved-input-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .profile__saved-input-row input {
    flex: 1;
  }

  .profile__saved-input-row button {
    margin: 0;
  }

  .profile__saved-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .profile__saved-actions button {
    margin: 0;
    padding: 0.55rem 1.3rem;
  }

  .profile__saved-actions .danger {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }

  .profile__saved-empty {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .profile__saved-message {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .profile__saved-message--success {
    color: #16a34a;
  }

  .profile__saved-message--error {
    color: #dc2626;
  }
</style>
