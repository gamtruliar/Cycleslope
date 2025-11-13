<script lang="ts">
  import { t } from '../i18n';
</script>

<section class="hero glass">
  <div class="hero__content">
    <p class="eyebrow">{$t.hero.eyebrow}</p>
    <h1>{$t.hero.title}</h1>
    <p class="lead">{$t.hero.lead}</p>
    <ul class="hero__highlights">
      {#each $t.hero.highlights as highlight}
        <li>
          <span class="bullet" aria-hidden="true">✔</span>
          <span>{highlight}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .hero {
    margin: 2.5rem auto;
    padding: 2.5rem 3rem;
    border-radius: 24px;
    background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 60%),
      rgba(255, 255, 255, 0.92);
  }

  .hero__content {
    display: grid;
    gap: 1.5rem;
    max-width: 640px;
  }

  .eyebrow {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    margin: 0;
    color: #2563eb;
  }

  h1 {
    font-size: clamp(2.2rem, 3vw, 3rem);
    margin: 0;
  }

  .lead {
    margin: 0;
    color: #475569;
    line-height: 1.6;
  }

  .hero__highlights {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }

  .hero__highlights li {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: rgba(148, 163, 184, 0.14);
  }

  .bullet {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 999px;
    background: #2563eb;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    margin-top: 0.1rem;
  }

  @media (max-width: 768px) {
    .hero {
      padding: 2rem;
    }
  }
</style>
