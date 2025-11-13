<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import HeroSection from './components/HeroSection.svelte';
  import Filters from './components/Filters.svelte';
  import UserProfile from './components/UserProfile.svelte';
  import SlopeTable from './components/SlopeTable.svelte';
  import MapView from './components/MapView.svelte';
  import { t } from './i18n';
</script>

<TopBar />
<main class="container">
  <HeroSection />
  <UserProfile />
  <Filters />
  <SlopeTable />
  <MapView />
</main>
<footer>
  <div class="container footer__content">
    <p>{$t.footer.message}</p>
    <nav>
      <a href="https://github.com/">{$t.footer.links.github}</a>
      <a href="mailto:hello@hk-slopes.example">{$t.footer.links.contact}</a>
      <a href="https://example.com/privacy" rel="noreferrer">{$t.footer.links.privacy}</a>
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

  a {
    color: inherit;
    text-decoration: none;
  }
</style>
