import { writable, type Readable } from 'svelte/store';
import type { SuitabilityLevel } from '../i18n';

export interface SlopeRecord {
  name: string;
  location: string;
  distanceKm: number;
  avgGradient: number;
  maxGradient: number;
  suitability: SuitabilityLevel;
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
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
  const avgGradient = parseNumberField(record['avg_gradient'] ?? record['avg_gradient_pct'], 'avg_gradient', lineNumber);
  const maxGradient = parseNumberField(record['max_gradient'] ?? record['max_gradient_pct'], 'max_gradient', lineNumber);

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
    avgGradient,
    maxGradient,
    suitability: classifySlope(distanceKm, avgGradient, maxGradient),
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

function classifySlope(distanceKm: number, avgGradient: number, maxGradient: number): SuitabilityLevel {
  if (avgGradient >= 10 || (avgGradient >= 9 && distanceKm >= 5.5) || maxGradient >= 18) {
    return 'Brutal';
  }

  if (avgGradient >= 9 || distanceKm >= 5) {
    return 'Challenging';
  }

  return 'Friendly';
}
