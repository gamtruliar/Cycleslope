<script lang="ts">
  import { availableLanguages, language, t, type LanguageCode } from '../i18n';

  let selectedLanguage: LanguageCode;

  $: selectedLanguage = $language;

  const handleChange = () => {
    language.set(selectedLanguage);
  };
</script>

<label class="sr-only" for="language-select">{$t.topBar.languageSwitcherLabel}</label>
<div class="language-switcher">
  <span aria-hidden="true" class="language-switcher__icon">🌐</span>
  <select
    id="language-select"
    class="language-switcher__select"
    bind:value={selectedLanguage}
    on:change={handleChange}
  >
    {#each availableLanguages as option}
      <option value={option.code}>{option.label}</option>
    {/each}
  </select>
</div>

<style>
  .language-switcher {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 999px;
    padding: 0.3rem 0.75rem;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .language-switcher__icon {
    font-size: 1rem;
  }

  .language-switcher__select {
    border: none;
    background: transparent;
    font-weight: 600;
    color: #0f172a;
    font-size: 0.85rem;
    padding: 0;
    appearance: none;
  }

  .language-switcher__select:focus {
    outline: none;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
