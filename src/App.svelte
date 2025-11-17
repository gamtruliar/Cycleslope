<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import HeroSection from './components/HeroSection.svelte';
  import Filters from './components/Filters.svelte';
  import UserProfile from './components/UserProfile.svelte';
  import MapView from './components/MapView.svelte';
  import PrivacyModal from './components/PrivacyModal.svelte';
  import { t } from './i18n';

  let showPrivacy = false;

  const openPrivacy = () => {
    showPrivacy = true;
  };

  const closePrivacy = () => {
    showPrivacy = false;
  };
</script>

<TopBar />
<PrivacyModal open={showPrivacy} on:close={closePrivacy} />
<main class="container">
  <HeroSection />
  <MapView />
  <UserProfile />
  <Filters />
</main>
<footer>
  <div class="container footer__content">
    <p>{$t.footer.message}</p>
    <nav>
      <a href="https://github.com/gamtruliar/Cycleslope" target="_blank" rel="noreferrer">
        {$t.footer.links.github}
      </a>
      <a
        href="https://github.com/gamtruliar/Cycleslope/issues"
        target="_blank"
        rel="noreferrer"
      >
        {$t.footer.links.contact}
      </a>
      <button type="button" on:click={openPrivacy}>{$t.footer.links.privacy}</button>
    </nav>
  </div>
</footer>

<style>
  main {
    padding-bottom: 4rem;
  }

  footer {
    background: rgba(15, 23, 42, 0.9);
    color: white;
    padding: 2rem 0;
  }

  .footer__content {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.9rem;
    align-items: center;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  a,
  button {
    color: inherit;
    text-decoration: none;
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    padding: 0;
  }

  button:hover,
  a:hover {
    text-decoration: underline;
  }
</style>
