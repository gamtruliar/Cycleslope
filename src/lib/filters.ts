import { writable, type Readable } from 'svelte/store';

const searchStore = writable('');

type SearchQueryStore = Readable<string> & {
  set(value: string): void;
  reset(): void;
};

export const searchQuery: SearchQueryStore = {
  subscribe: searchStore.subscribe,
  set(value: string) {
    searchStore.set(value);
  },
  reset() {
    searchStore.set('');
  },
};
