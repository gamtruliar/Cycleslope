import { writable, type Readable } from 'svelte/store';

export interface UserSettings {
  ftp: number;
  riderWeightKg: number;
  bikeWeightKg: number;
  cargoWeightKg: number;
  frontChainringTeeth: number;
  rearSprocketTeeth: number;
  wheelCircumferenceMm: number;
  minCadence: number;
}

export interface SavedProfile {
  id: string;
  name: string;
  settings: UserSettings;
  updatedAt: number;
}

export const defaultSettings: UserSettings = {
  ftp: 240,
  riderWeightKg: 60,
  bikeWeightKg: 9,
  cargoWeightKg: 3,
  frontChainringTeeth: 34,
  rearSprocketTeeth: 32,
  wheelCircumferenceMm: 2096,
  minCadence: 70,
};

export function getTotalSystemMassKg(settings: UserSettings): number {
  const rider = Math.max(settings.riderWeightKg, 0);
  const bike = Math.max(settings.bikeWeightKg, 0);
  const cargo = Math.max(settings.cargoWeightKg, 0);
  return rider + bike + cargo;
}

const STORAGE_KEY = 'cycleslope:settings';
const PROFILES_STORAGE_KEY = 'cycleslope:profiles';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toNumber(candidate: unknown, fallback: number): number {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === 'string') {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeSettings(value: Partial<UserSettings> | null | undefined): UserSettings {
  const legacyMass = toNumber(
    (value as Partial<UserSettings> & { massKg?: unknown })?.massKg,
    defaultSettings.riderWeightKg + defaultSettings.bikeWeightKg + defaultSettings.cargoWeightKg,
  );
  const hasNewWeights =
    value?.riderWeightKg !== undefined ||
    value?.bikeWeightKg !== undefined ||
    value?.cargoWeightKg !== undefined;

  let riderWeightKg = toNumber(value?.riderWeightKg, defaultSettings.riderWeightKg);
  const bikeWeightKg = toNumber(value?.bikeWeightKg, defaultSettings.bikeWeightKg);
  const cargoWeightKg = toNumber(value?.cargoWeightKg, defaultSettings.cargoWeightKg);

  if (!hasNewWeights && (value as Partial<UserSettings> & { massKg?: unknown })?.massKg !== undefined) {
    const inferredRider = legacyMass - bikeWeightKg - cargoWeightKg;
    riderWeightKg = Math.max(inferredRider, defaultSettings.riderWeightKg);
  }

  return {
    ftp: toNumber(value?.ftp, defaultSettings.ftp),
    riderWeightKg,
    bikeWeightKg,
    cargoWeightKg,
    frontChainringTeeth: toNumber(value?.frontChainringTeeth, defaultSettings.frontChainringTeeth),
    rearSprocketTeeth: toNumber(value?.rearSprocketTeeth, defaultSettings.rearSprocketTeeth),
    wheelCircumferenceMm: toNumber(value?.wheelCircumferenceMm, defaultSettings.wheelCircumferenceMm),
    minCadence: toNumber(value?.minCadence, defaultSettings.minCadence),
  };
}

function cloneSettings(value: UserSettings): UserSettings {
  return {
    ftp: value.ftp,
    riderWeightKg: value.riderWeightKg,
    bikeWeightKg: value.bikeWeightKg,
    cargoWeightKg: value.cargoWeightKg,
    frontChainringTeeth: value.frontChainringTeeth,
    rearSprocketTeeth: value.rearSprocketTeeth,
    wheelCircumferenceMm: value.wheelCircumferenceMm,
    minCadence: value.minCadence,
  };
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

    return normalizeSettings(parsed);
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

function loadProfilesFromStorage(): SavedProfile[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const result = parsed
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }

        const candidate = entry as Partial<SavedProfile> & { settings?: Partial<UserSettings> };
        const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';

        if (!name) {
          return null;
        }

        const id =
          typeof candidate.id === 'string' && candidate.id.trim()
            ? candidate.id
            : generateId();
        const updatedAt =
          typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)
            ? candidate.updatedAt
            : Date.now();

        return {
          id,
          name,
          settings: normalizeSettings(candidate.settings),
          updatedAt,
        } satisfies SavedProfile;
      })
      .filter((value): value is SavedProfile => Boolean(value));

    result.sort((a, b) => b.updatedAt - a.updatedAt);
    return result;
  } catch (error) {
    console.warn('Failed to load saved profiles from storage', error);
    return [];
  }
}

function persistProfiles(profiles: SavedProfile[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.warn('Failed to persist saved profiles to storage', error);
  }
}

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSettingsStore() {
  const initial = loadFromStorage() ?? defaultSettings;
  const store = writable<UserSettings>(cloneSettings(initial));

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
    store.set(cloneSettings(defaultSettings));
  };

  const setAll = (value: UserSettings) => {
    store.set(cloneSettings(normalizeSettings(value)));
  };

  return {
    subscribe: store.subscribe,
    updateSetting,
    reset,
    setAll,
  } satisfies Readable<UserSettings> & {
    updateSetting: typeof updateSetting;
    reset: typeof reset;
    setAll: typeof setAll;
  };
}

function createSavedProfilesStore() {
  const store = writable<SavedProfile[]>(loadProfilesFromStorage());

  if (isBrowser()) {
    store.subscribe((value) => {
      persistProfiles(value);
    });
  }

  const saveProfile = (name: string, currentSettings: UserSettings): SavedProfile => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Profile name is required.');
    }

    let saved: SavedProfile | null = null;

    store.update((profiles) => {
      const next = [...profiles];
      const existingIndex = next.findIndex(
        (profile) => profile.name.toLowerCase() === trimmed.toLowerCase(),
      );

      const profile: SavedProfile = {
        id: existingIndex >= 0 ? next[existingIndex].id : generateId(),
        name: trimmed,
        settings: cloneSettings(normalizeSettings(currentSettings)),
        updatedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        next[existingIndex] = profile;
      } else {
        next.push(profile);
      }

      next.sort((a, b) => b.updatedAt - a.updatedAt);
      saved = profile;
      return next;
    });

    return saved as SavedProfile;
  };

  const deleteProfile = (id: string): SavedProfile | null => {
    let removed: SavedProfile | null = null;

    store.update((profiles) => {
      const next = profiles.filter((profile) => {
        if (profile.id === id) {
          removed = profile;
          return false;
        }
        return true;
      });

      return next;
    });

    return removed;
  };

  return {
    subscribe: store.subscribe,
    saveProfile,
    deleteProfile,
  };
}

export const settings = createSettingsStore();
export const savedProfiles = createSavedProfilesStore();
