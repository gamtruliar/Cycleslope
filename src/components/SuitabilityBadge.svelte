<script lang="ts">
  export let level: 'Friendly' | 'Challenging' | 'Brutal' = 'Friendly';
</script>

<span class={`badge badge--${level.toLowerCase()}`}>
  {#if level === 'Friendly'}
    🌤️ {level}
  {:else if level === 'Challenging'}
    ⚡ {level}
  {:else}
    🧗‍♂️ {level}
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
