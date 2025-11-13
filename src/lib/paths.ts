import { derived, get, writable, type Readable } from 'svelte/store';
import { loadSlopes, slopes } from './slopes';

export interface PathPoint {
  groupId: string;
  lat: number;
  lng: number;
  ele: number;
}

interface CsvPoint {
  lat: number;
  lng: number;
  ele: number;
}

export type PathLoadState = 'idle' | 'loading' | 'ready' | 'error';

const pathPointsStore = writable<PathPoint[]>([]);
const loadStateStore = writable<PathLoadState>('idle');
const errorStore = writable<string | null>(null);

let hasLoaded = false;
let currentRequest: Promise<void> | null = null;

const MAX_POINTS_PER_GROUP = 100;

export const pathPoints: Readable<PathPoint[]> = {
  subscribe: pathPointsStore.subscribe,
};

export const pathLoadState: Readable<PathLoadState> = {
  subscribe: loadStateStore.subscribe,
};

export const pathError: Readable<string | null> = {
  subscribe: errorStore.subscribe,
};

export const pathsByGroup = derived(pathPointsStore, ($points) => {
  return $points.reduce<Record<string, PathPoint[]>>((groups, point) => {
    if (!groups[point.groupId]) {
      groups[point.groupId] = [];
    }
    groups[point.groupId].push(point);
    return groups;
  }, {});
});

export async function loadPaths(force = false): Promise<void> {
  if (!force) {
    if (hasLoaded) return;
    if (currentRequest) return currentRequest;
  }

  loadStateStore.set('loading');
  errorStore.set(null);

  const request = fetchAllGroups()
    .then((points) => {
      pathPointsStore.set(points);
      loadStateStore.set('ready');
      errorStore.set(null);
      hasLoaded = true;
    })
    .catch((error) => {
      loadStateStore.set('error');
      errorStore.set(error instanceof Error ? error.message : 'Unknown error');
      pathPointsStore.set([]);
      hasLoaded = false;
      throw error;
    })
    .finally(() => {
      currentRequest = null;
    });

  currentRequest = request;
  return request;
}

async function fetchAllGroups(): Promise<PathPoint[]> {
  await loadSlopes();
  const slopeRecords = get(slopes);
  const groupIds = Array.from(
    new Set(
      slopeRecords
        .map((record) => record.pathGroupId.trim())
        .filter((groupId) => groupId.length > 0),
    ),
  );

  if (groupIds.length === 0) {
    return [];
  }

  const groupPoints = await Promise.all(
    groupIds.map(async (groupId) => {
      const points = await fetchGroup(groupId);
      return simplifyPoints(points, MAX_POINTS_PER_GROUP);
    }),
  );

  return groupPoints.flat();
}

async function fetchGroup(groupId: string): Promise<PathPoint[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/paths/${groupId}.csv`, {
    headers: {
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch path data for ${groupId} (status ${response.status})`);
  }

  const text = await response.text();
  const points = parseCsv(text);
  return points.map((point) => ({
    groupId,
    lat: point.lat,
    lng: point.lng,
    ele: point.ele,
  }));
}

function parseCsv(csvText: string): CsvPoint[] {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rowLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) => header.trim().toLowerCase());

  const requiredHeaders = ['lat', 'lng', 'ele'];
  const missingHeader = requiredHeaders.find((header) => !headers.includes(header));
  if (missingHeader) {
    throw new Error(`Missing required column: ${missingHeader}`);
  }

  const records: CsvPoint[] = [];

  rowLines.forEach((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} columns, expected ${headers.length}.`);
    }

    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]]));
    const lat = parseNumberField(record['lat'], 'lat', index + 2);
    const lng = parseNumberField(record['lng'], 'lng', index + 2);
    const ele = parseNumberField(record['ele'], 'ele', index + 2);

    records.push({
      lat,
      lng,
      ele,
    });
  });

  return records;
}

function simplifyPoints(points: PathPoint[], maxPoints: number): PathPoint[] {
  if (maxPoints <= 0 || points.length <= maxPoints) {
    return points;
  }

  if (maxPoints === 1) {
    return [points[0]];
  }

  const step = (points.length - 1) / (maxPoints - 1);
  const indices = new Set<number>();

  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round(i * step);
    indices.add(Math.min(points.length - 1, Math.max(0, index)));
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => points[index]);
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
