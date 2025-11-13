<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '../i18n';
  import { savedProfiles, settings, type UserSettings } from '../lib/settings';

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
