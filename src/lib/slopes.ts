import { derived, writable, type Readable } from 'svelte/store';
import type { SuitabilityLevel } from '../i18n';
import { difficultyFilter, distanceRange, gradientRange, searchQuery } from './filters';
import { getTotalSystemMassKg, settings, type UserSettings } from './settings';

export const GRADIENT_THRESHOLDS = [3, 5, 7, 10, 13, 17, 20, 25, 30, 40] as const;
export type GradientThreshold = (typeof GRADIENT_THRESHOLDS)[number];

export type GradientBreakdown = Record<GradientThreshold, number>;

export interface SlopeRecord {
  name: string;
  location: string;
  distanceKm: number;
  totalAscent: number;
  avgGradient: number;
  maxGradient: number;
  gradientDistances: GradientBreakdown;
  pathGroupId: string | null;
  youtubeLink: string | null;
}

export interface SlopeMetrics {
  minSpeedMps: number;
  averagePowerWatts: number;
  peakPowerWatts: number;
  ftpRatio: number;
  peakFtpRatio: number;
  sustainedFtpRatio: number;
  climbTimeSeconds: number;
}

export interface EnrichedSlope extends SlopeRecord {
  detailDifficultyScore: number;
  metrics: SlopeMetrics;
  suitability: SuitabilityLevel;
  burstWarning: number | null;
  difficultyTags: string[];
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

export function formatDifficultyScore(score: number): string {
  return `${formatNumber(score)} pts`;
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
  const gradientDistances = parseGradientDistances(record, lineNumber);
  const pathGroupId = (record['path_group_id'] ?? record['group_id'] ?? record['pathgroupid'] ?? '').trim();
  const youtubeLink = (record['youtube_link'] ?? '').trim();

  if (!name) {
    throw new Error(`Row ${lineNumber} is missing a name column.`);
  }

  if (!location) {
    throw new Error(`Row ${lineNumber} is missing a location column.`);
  }

  return {
    name,
    location,
    distanceKm,
    totalAscent,
    avgGradient,
    maxGradient,
    gradientDistances,
    pathGroupId: pathGroupId || null,
    youtubeLink: youtubeLink || null,
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

function parseOptionalNumberField(
  value: string | undefined,
  field: string,
  lineNumber: number,
  fallback: number,
): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Row ${lineNumber} has an invalid number for ${field}: ${value}`);
  }

  return parsed;
}

function parseGradientDistances(record: Record<string, string>, lineNumber: number): GradientBreakdown {
  return GRADIENT_THRESHOLDS.reduce<GradientBreakdown>((acc, threshold) => {
    const key = `gradient_${threshold}_distance_km`;
    const value = parseOptionalNumberField(record[key], key, lineNumber, 0);
    acc[threshold] = Math.max(0, value ?? 0);
    return acc;
  }, {} as GradientBreakdown);
}

const G = 9.80665;
const MIN_SPEED_FLOOR = 0.7; // metres per second (~2.5 km/h)
const DEFAULT_CRR = 0.0045;
const DEFAULT_CDA = 0.32;
const DEFAULT_AIR_DENSITY = 1.226;
const MIN_SUSTAINED_DISTANCE_KM = 0.2;
const MIN_SUSTAINED_DISTANCE_RATIO = 0.15;

function enrichSlope(slope: SlopeRecord, rider: UserSettings): EnrichedSlope {
  const minSpeed = computeMinSpeed(rider);
  const averagePower = computePowerRequirement(slope.avgGradient / 100, minSpeed, rider);
  const peakPower = computePowerRequirement(slope.maxGradient / 100, minSpeed, rider);
  const ftp = Math.max(rider.ftp, 1);
  const ftpRatio = averagePower / ftp;
  const peakFtpRatio = peakPower / ftp;
  const climbTimeSeconds = computeClimbTime(slope.distanceKm, minSpeed);
  const sustainedFtpRatio = computeSustainedDifficultyRatio(
    slope.gradientDistances,
    rider,
    minSpeed,
    ftp,
    slope.distanceKm,
    ftpRatio,
  );
  const suitability = classifyDifficulty(Math.max(ftpRatio, sustainedFtpRatio));
  const burstWarning = peakFtpRatio > 1.2 ? peakFtpRatio : null;
  const detailDifficultyScore = computeDetailDifficulty(slope.gradientDistances, rider, minSpeed);
  const difficultyTags = buildDifficultyTags(slope, slope.gradientDistances);

  return {
    ...slope,
    detailDifficultyScore,
    metrics: {
      minSpeedMps: minSpeed,
      averagePowerWatts: averagePower,
      peakPowerWatts: peakPower,
      ftpRatio,
      peakFtpRatio,
      sustainedFtpRatio,
      climbTimeSeconds,
    },
    suitability,
    burstWarning,
    difficultyTags,
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

function computeSustainedDifficultyRatio(
  gradientDistances: GradientBreakdown,
  rider: UserSettings,
  minSpeed: number,
  ftp: number,
  totalDistanceKm: number,
  fallbackRatio: number,
): number {
  const ftpValue = Math.max(ftp, 1);
  const totalDistance = Math.max(totalDistanceKm, 0);
  let maxRatio = 0;

  for (const threshold of GRADIENT_THRESHOLDS) {
    const sustainedDistance = Math.max(gradientDistances[threshold] ?? 0, 0);
    //const sustainedFraction = totalDistance > 0 ? sustainedDistance / totalDistance : 0;
    if (
      sustainedDistance >= MIN_SUSTAINED_DISTANCE_KM
      //sustainedFraction >= MIN_SUSTAINED_DISTANCE_RATIO
    ) {
      const grade = threshold / 100;
      const requiredPower = computePowerRequirement(grade, minSpeed, rider);
      const ratio = requiredPower / ftpValue;
      maxRatio = Math.max(maxRatio, ratio);
    }
  }

  if (maxRatio > 0) {
    return maxRatio;
  }

  return fallbackRatio;
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

function computeDetailDifficulty(
  gradientDistances: GradientBreakdown,
  rider: UserSettings,
  providedMinSpeed?: number,
): number {
  const minSpeed = Number.isFinite(providedMinSpeed) && providedMinSpeed ? providedMinSpeed : computeMinSpeed(rider);
  const ftp = Math.max(rider.ftp, 1);

  return GRADIENT_THRESHOLDS.reduce((score, threshold) => {
    const distance = gradientDistances[threshold] ?? 0;
    if (!distance) {
      return score;
    }

    const grade = threshold / 100;
    const requiredPower = computePowerRequirement(grade, minSpeed, rider);
    const difficultyFactor = requiredPower / ftp;
    return score + distance * threshold * difficultyFactor;
  }, 0);
}

function buildDifficultyTags(slope: SlopeRecord, breakdown: GradientBreakdown): string[] {
  const tags: string[] = [];
  const sustained13 = (breakdown[13] ?? 0) >= 0.8 || (breakdown[10] ?? 0) >= 1.2;
  const punchy20 = (breakdown[20] ?? 0) >= 0.2 || (breakdown[25] ?? 0) >= 0.1;
  const walls30 = (breakdown[30] ?? 0) >= 0.03 || (breakdown[40] ?? 0) > 0;
  const endurance = slope.distanceKm >= 4 && slope.avgGradient >= 5;

  if (sustained13) {
    tags.push('sustained13');
  }

  if (punchy20) {
    tags.push('punchy20');
  }

  if (walls30) {
    tags.push('wall30');
  }

  if (endurance) {
    tags.push('endurance');
  }

  if (!tags.length && slope.avgGradient < 5) {
    tags.push('rolling');
  }

  if (!tags.length) {
    tags.push('balanced');
  }

  return tags;
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
