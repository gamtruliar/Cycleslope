import { derived, writable, type Readable } from 'svelte/store';

export interface PathPoint {
  groupId: string;
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

  const request = fetchCsv()
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

async function fetchCsv(): Promise<PathPoint[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/paths.csv`, {
    headers: {
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch paths dataset (status ${response.status})`);
  }

  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(csvText: string): PathPoint[] {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rowLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) => header.trim().toLowerCase());

  const requiredHeaders = ['groupid', 'lat', 'lng', 'ele'];
  const missingHeader = requiredHeaders.find((header) => !headers.includes(header));
  if (missingHeader) {
    throw new Error(`Missing required column: ${missingHeader}`);
  }

  const records: PathPoint[] = [];

  rowLines.forEach((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} columns, expected ${headers.length}.`);
    }

    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]]));
    const groupId = (record['groupid'] ?? '').trim();
    const lat = parseNumberField(record['lat'], 'lat', index + 2);
    const lng = parseNumberField(record['lng'], 'lng', index + 2);
    const ele = parseNumberField(record['ele'], 'ele', index + 2);

    if (!groupId) {
      throw new Error(`Row ${index + 2} is missing a value for groupId.`);
    }

    records.push({
      groupId,
      lat,
      lng,
      ele,
    });
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
