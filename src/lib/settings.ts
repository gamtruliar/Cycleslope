import { writable, type Readable } from 'svelte/store';

export interface UserSettings {
  ftp: number;
  massKg: number;
  frontChainringTeeth: number;
  rearSprocketTeeth: number;
  wheelCircumferenceMm: number;
  minCadence: number;
}

export const defaultSettings: UserSettings = {
  ftp: 240,
  massKg: 68,
  frontChainringTeeth: 34,
  rearSprocketTeeth: 32,
  wheelCircumferenceMm: 2096,
  minCadence: 70,
};

const STORAGE_KEY = 'cycleslope:settings';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadFromStorage(): UserSettings | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    if (!parsed) {
      return null;
    }

    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.warn('Failed to load settings from storage', error);
    return null;
  }
}

function persistToStorage(settings: UserSettings): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to persist settings to storage', error);
  }
}

function createSettingsStore() {
  const initial = loadFromStorage() ?? defaultSettings;
  const store = writable<UserSettings>(initial);

  if (isBrowser()) {
    store.subscribe((value) => {
      persistToStorage(value);
    });
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    store.update((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const reset = () => {
    store.set(defaultSettings);
  };

  return {
    subscribe: store.subscribe,
    updateSetting,
    reset,
  } satisfies Readable<UserSettings> & {
    updateSetting: typeof updateSetting;
    reset: typeof reset;
  };
}

export const settings = createSettingsStore();
