import { writable, type Readable } from 'svelte/store';
import type { SuitabilityLevel } from '../i18n';

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

type Range = {
  min: number;
  max: number;
};

function createRangeStore(initial: Range, limits?: Range) {
  const normalizeRange = (range: Range): Range => {
    const clampValue = (value: number, key: keyof Range) => {
      if (!Number.isFinite(value)) {
        return initial[key];
      }

      if (!limits) {
        return value;
      }

      const lower = limits.min;
      const upper = limits.max;
      return Math.min(upper, Math.max(lower, value));
    };

    const min = clampValue(range.min, 'min');
    const max = clampValue(range.max, 'max');

    if (min > max) {
      return { min: max, max };
    }

    return { min, max };
  };

  const store = writable<Range>(normalizeRange(initial));

  return {
    subscribe: store.subscribe,
    set(range: Range) {
      store.set(normalizeRange(range));
    },
    setMin(min: number) {
      store.update((current) => normalizeRange({ min, max: current.max }));
    },
    setMax(max: number) {
      store.update((current) => normalizeRange({ min: current.min, max }));
    },
    reset() {
      store.set(normalizeRange(initial));
    },
  } satisfies Readable<Range> & {
    set(range: Range): void;
    setMin(min: number): void;
    setMax(max: number): void;
    reset(): void;
  };
}

const difficultyStore = writable<SuitabilityLevel[]>([]);

export const difficultyFilter: Readable<SuitabilityLevel[]> & {
  toggle(level: SuitabilityLevel): void;
  setAll(levels: SuitabilityLevel[]): void;
  clear(): void;
} = {
  subscribe: difficultyStore.subscribe,
  toggle(level: SuitabilityLevel) {
    difficultyStore.update((current) => {
      const next = new Set(current);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return Array.from(next);
    });
  },
  setAll(levels: SuitabilityLevel[]) {
    difficultyStore.set([...levels]);
  },
  clear() {
    difficultyStore.set([]);
  },
};

const DEFAULT_GRADIENT_LIMITS: Range = { min: 0, max: 25 };

export const gradientRange = createRangeStore({ min: 0, max: 20 }, DEFAULT_GRADIENT_LIMITS);
