<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { t } from '../i18n';

  export let open = false;

  const dispatch = createEventDispatcher();

  const close = () => {
    dispatch('close');
  };

  let previousOverflow: string | null = null;

  function restoreOverflow() {
    if (typeof document === 'undefined' || previousOverflow === null) {
      return;
    }

    document.body.style.overflow = previousOverflow;
    previousOverflow = null;
  }

  $: if (typeof document !== 'undefined') {
    if (open) {
      if (previousOverflow === null) {
        previousOverflow = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else {
      restoreOverflow();
    }
  }

  onDestroy(() => {
    restoreOverflow();
  });
</script>

{#if open}
  <div class="backdrop" role="presentation" on:click={close}></div>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
    <div class="modal__content">
      <h2 id="privacy-title">{$t.privacy.title}</h2>
      <p>{$t.privacy.body}</p>
      <button type="button" on:click={close}>{$t.privacy.close}</button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    z-index: 40;
  }

  .modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 50;
  }

  .modal__content {
    max-width: 520px;
    background: white;
    border-radius: 18px;
    padding: 2rem;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.25);
    display: grid;
    gap: 1.25rem;
  }

  h2 {
    margin: 0;
    font-size: 1.35rem;
  }

  p {
    margin: 0;
    color: #475569;
    line-height: 1.6;
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
</style>
