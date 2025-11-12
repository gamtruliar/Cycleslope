<script lang="ts">
  import { t } from '../i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
</script>

<header class="topbar">
  <div class="container topbar__content">
    <div class="topbar__brand">
      <span class="brand-icon">🚴‍♀️</span>
      <div>
        <p class="brand-title">{$t.topBar.brandTitle}</p>
        <p class="brand-subtitle">{$t.topBar.brandSubtitle}</p>
      </div>
    </div>
    <nav class="topbar__nav">
      <a href="#filters">{$t.topBar.nav.filters}</a>
      <a href="#profile">{$t.topBar.nav.profile}</a>
      <a href="#slopes">{$t.topBar.nav.slopes}</a>
      <a href="#map">{$t.topBar.nav.map}</a>
    </nav>
    <div class="topbar__actions">
      <LanguageSwitcher />
      <button class="cta">{$t.topBar.cta}</button>
    </div>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(14px);
  }

  .topbar__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 0;
  }

  .topbar__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-icon {
    font-size: 1.75rem;
  }

  .brand-title {
    margin: 0;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: -0.01em;
  }

  .brand-subtitle {
    margin: 0;
    color: #64748b;
    font-size: 0.8rem;
  }

  .topbar__nav {
    display: flex;
    gap: 1.5rem;
    font-size: 0.95rem;
  }

  .topbar__nav a {
    color: #334155;
    text-decoration: none;
    font-weight: 500;
  }

  .topbar__actions {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cta {
    border: none;
    background: linear-gradient(135deg, #2563eb, #0ea5e9);
    color: white;
    padding: 0.55rem 1.3rem;
    border-radius: 999px;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .topbar__content {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .topbar__nav {
      order: 3;
      width: 100%;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .topbar__actions {
      width: 100%;
      justify-content: space-between;
      order: 2;
    }

    .topbar__actions > :global(.language-switcher) {
      flex: 1;
    }

    .topbar__actions .cta {
      flex: 1;
      justify-content: center;
      display: inline-flex;
    }
  }

  @media (max-width: 480px) {
    .topbar__actions {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
  }
</style>
