import { derived, writable, type Readable } from 'svelte/store';
import type { SuitabilityLevel } from '../i18n';
import { difficultyFilter, distanceRange, gradientRange, searchQuery } from './filters';
import { getTotalSystemMassKg, settings, type UserSettings } from './settings';

export interface SlopeRecord {
  name: string;
  location: string;
  distanceKm: number;
  totalAscent: number;
  avgGradient: number;
  maxGradient: number;
  pathGroupId: string;
}

export interface SlopeMetrics {
  minSpeedMps: number;
  averagePowerWatts: number;
  peakPowerWatts: number;
  ftpRatio: number;
  peakFtpRatio: number;
  climbTimeSeconds: number;
}

export interface EnrichedSlope extends SlopeRecord {
  metrics: SlopeMetrics;
  suitability: SuitabilityLevel;
  burstWarning: boolean;
}

export type SlopeLoadState = 'idle' | 'loading' | 'ready' | 'error';

const slopesStore = writable<SlopeRecord[]>([]);
const loadStateStore = writable<SlopeLoadState>('idle');
const errorStore = writable<string | null>(null);

let hasLoaded = false;
let currentRequest: Promise<void> | null = null;

export const slopes: Readable<SlopeRecord[]> = {
  subscribe: slopesStore.subscribe,
};

export const computedSlopes = derived([slopesStore, settings], ([$slopes, $settings]) => {
  return $slopes.map((slope) => enrichSlope(slope, $settings));
});

export const filteredSlopes = derived(
  [computedSlopes, searchQuery, difficultyFilter, gradientRange, distanceRange],
  ([$slopes, $query, $difficulty, $gradient, $distance]) => {
    const normalizedQuery = $query.trim().toLowerCase();
    const difficultySet = new Set($difficulty);
    const constrainDifficulty = difficultySet.size > 0;

    return $slopes.filter((slope) => {
      if (
        normalizedQuery &&
        ![slope.name, slope.location].some((value) => value.toLowerCase().includes(normalizedQuery))
      ) {
        return false;
      }

      if (constrainDifficulty && !difficultySet.has(slope.suitability)) {
        return false;
      }

      if (Number.isFinite($gradient.min) && slope.avgGradient < $gradient.min) {
        return false;
      }

      if (Number.isFinite($gradient.max) && slope.avgGradient > $gradient.max) {
        return false;
      }

      if (Number.isFinite($distance.min) && slope.distanceKm < $distance.min) {
        return false;
      }

      if (Number.isFinite($distance.max) && slope.distanceKm > $distance.max) {
        return false;
      }

      return true;
    });
  },
);

export const slopeLoadState: Readable<SlopeLoadState> = {
  subscribe: loadStateStore.subscribe,
};

export const slopeError: Readable<string | null> = {
  subscribe: errorStore.subscribe,
};

export async function loadSlopes(force = false): Promise<void> {
  if (!force) {
    if (hasLoaded) return;
    if (currentRequest) return currentRequest;
  }

  loadStateStore.set('loading');
  errorStore.set(null);

  const request = fetchCsv()
    .then((records) => {
      slopesStore.set(records);
      loadStateStore.set('ready');
      errorStore.set(null);
      hasLoaded = true;
    })
    .catch((error) => {
      loadStateStore.set('error');
      errorStore.set(error instanceof Error ? error.message : 'Unknown error');
      slopesStore.set([]);
      hasLoaded = false;
      throw error;
    })
    .finally(() => {
      currentRequest = null;
    });

  currentRequest = request;
  return request;
}

export function formatDistance(distanceKm: number): string {
  return `${formatNumber(distanceKm)} km`;
}

export function formatGradient(gradient: number): string {
  return `${formatNumber(gradient)}%`;
}

export function formatElevation(ascentMeters: number): string {
  return `${formatInteger(ascentMeters)} m`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

async function fetchCsv(): Promise<SlopeRecord[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/slopes.csv`, {
    headers: {
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch slopes dataset (status ${response.status})`);
  }

  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(csvText: string): SlopeRecord[] {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rowLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) => header.trim().toLowerCase());

  const records: SlopeRecord[] = [];

  rowLines.forEach((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} columns, expected ${headers.length}.`);
    }

    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]]));
    records.push(transformRecord(record, index + 2));
  });

  return records;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function transformRecord(record: Record<string, string>, lineNumber: number): SlopeRecord {
  const name = record['name'];
  const location = record['location'];
  const distanceKm = parseNumberField(record['distance_km'] ?? record['distancekm'], 'distance_km', lineNumber);
  const totalAscent = parseNumberField(
    record['total_ascent_m'] ?? record['total_ascent'] ?? record['elev_gain_m'],
    'total_ascent_m',
    lineNumber,
  );
  const avgGradient = parseNumberField(record['avg_gradient'] ?? record['avg_gradient_pct'], 'avg_gradient', lineNumber);
  const maxGradient = parseNumberField(record['max_gradient'] ?? record['max_gradient_pct'], 'max_gradient', lineNumber);
  const pathGroupId = record['path_group_id'] ?? record['group_id'] ?? record['pathgroupid'];

  if (!name) {
    throw new Error(`Row ${lineNumber} is missing a name column.`);
  }

  if (!location) {
    throw new Error(`Row ${lineNumber} is missing a location column.`);
  }

  if (!pathGroupId) {
    throw new Error(`Row ${lineNumber} is missing a path_group_id column.`);
  }

  return {
    name,
    location,
    distanceKm,
    totalAscent,
    avgGradient,
    maxGradient,
    pathGroupId,
  };
}

function parseNumberField(value: string | undefined, field: string, lineNumber: number): number {
  if (value === undefined || value === '') {
    throw new Error(`Row ${lineNumber} is missing a value for ${field}.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Row ${lineNumber} has an invalid number for ${field}: ${value}`);
  }

  return parsed;
}

const G = 9.80665;
const MIN_SPEED_FLOOR = 0.7; // metres per second (~2.5 km/h)
const DEFAULT_CRR = 0.0045;
const DEFAULT_CDA = 0.32;
const DEFAULT_AIR_DENSITY = 1.226;

function enrichSlope(slope: SlopeRecord, rider: UserSettings): EnrichedSlope {
  const minSpeed = computeMinSpeed(rider);
  const averagePower = computePowerRequirement(slope.avgGradient / 100, minSpeed, rider);
  const peakPower = computePowerRequirement(slope.maxGradient / 100, minSpeed, rider);
  const ftp = Math.max(rider.ftp, 1);
  const ftpRatio = averagePower / ftp;
  const peakFtpRatio = peakPower / ftp;
  const climbTimeSeconds = computeClimbTime(slope.distanceKm, minSpeed);
  const suitability = classifyDifficulty(Math.max(ftpRatio, peakFtpRatio));
  const burstWarning = peakFtpRatio > 1.2;

  return {
    ...slope,
    metrics: {
      minSpeedMps: minSpeed,
      averagePowerWatts: averagePower,
      peakPowerWatts: peakPower,
      ftpRatio,
      peakFtpRatio,
      climbTimeSeconds,
    },
    suitability,
    burstWarning,
  };
}

function computeMinSpeed(rider: UserSettings): number {
  const front = Math.max(rider.frontChainringTeeth, 1);
  const rear = Math.max(rider.rearSprocketTeeth, 1);
  const ratio = front / rear;
  const circumferenceM = Math.max(rider.wheelCircumferenceMm, 1) / 1000;
  const cadence = Math.max(rider.minCadence, 30);

  const speed = (cadence * ratio * circumferenceM) / 60;
  return Math.max(speed, MIN_SPEED_FLOOR);
}

function computePowerRequirement(grade: number, speed: number, rider: UserSettings): number {
  const mass = Math.max(getTotalSystemMassKg(rider), 40);
  const normalizedGrade = Math.max(grade, 0);
  const rollingResistance = DEFAULT_CRR * mass * G;
  const gravityForce = mass * G * normalizedGrade;
  const aeroForce = 0.5 * DEFAULT_AIR_DENSITY * DEFAULT_CDA * speed * speed;
  const power = (rollingResistance + gravityForce) * speed + aeroForce * speed;
  return Math.max(power, 0);
}

function computeClimbTime(distanceKm: number, speed: number): number {
  const distanceMeters = Math.max(distanceKm, 0) * 1000;
  if (speed <= 0) {
    return 0;
  }

  return distanceMeters / speed;
}

function classifyDifficulty(ratio: number): SuitabilityLevel {
  if (ratio <= 0.85) {
    return 'Friendly';
  }

  if (ratio <= 1.05) {
    return 'Challenging';
  }

  return 'Brutal';
}

export function formatPower(power: number): string {
  return `${formatInteger(Math.round(power))} W`;
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;

  if (minutes <= 0) {
    return `${totalSeconds}s`;
  }

  return `${minutes}m ${remainder.toString().padStart(2, '0')}s`;
}

export function formatSpeed(speed: number): string {
  const kmh = speed * 3.6;
  return `${formatNumber(kmh)} km/h`;
}

export function formatFtpRatio(ratio: number): string {
  return `${formatNumber(ratio * 100)}% FTP`;
}
