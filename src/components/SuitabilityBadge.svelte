<script lang="ts">
  import { t, type SuitabilityLevel } from '../i18n';

  export let level: SuitabilityLevel = 'Friendly';
</script>

<span class={`badge badge--${level.toLowerCase()}`}>
  {#if level === 'Friendly'}
    🌤️ {$t.suitability[level]}
  {:else if level === 'Challenging'}
    ⚡ {$t.suitability[level]}
  {:else}
    🧗‍♂️ {$t.suitability[level]}
  {/if}
</span>

<style>
  .badge--friendly {
    background: rgba(34, 197, 94, 0.18);
    color: #166534;
  }

  .badge--challenging {
    background: rgba(250, 204, 21, 0.2);
    color: #92400e;
  }

  .badge--brutal {
    background: rgba(239, 68, 68, 0.18);
    color: #b91c1c;
  }
</style>
