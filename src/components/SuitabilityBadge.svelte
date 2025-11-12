<script lang="ts">
  export let level: 'Friendly' | 'Challenging' | 'Brutal' = 'Friendly';

  const labelMap = {
    Friendly: '友善',
    Challenging: '具挑戰性',
    Brutal: '極限',
  } as const;
</script>

<span class={`badge badge--${level.toLowerCase()}`}>
  {#if level === 'Friendly'}
    🌤️ {labelMap[level]}
  {:else if level === 'Challenging'}
    ⚡ {labelMap[level]}
  {:else}
    🧗‍♂️ {labelMap[level]}
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
