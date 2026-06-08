import * as fs from 'fs';
import * as path from 'path';

/**
 * Load a JSON file from the test-data directory.
 * Usage: loadJson<MyType>('users.json')
 */
export function loadJson<T>(filename: string): T {
  const filePath = path.resolve(__dirname, '../test-data', filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Load a CSV file from the test-data directory and parse it into
 * an array of objects keyed by header row.
 * Usage: loadCsv('quickSearch.csv')
 */
export function loadCsv(filename: string): Record<string, string>[] {
  const filePath = path.resolve(__dirname, '../test-data', filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

/**
 * Find a single row in a CSV by testcaseid column.
 * Throws if not found so tests fail fast with a clear message.
 */
export function getCsvRow(filename: string, testcaseid: string): Record<string, string> {
  const rows = loadCsv(filename);
  const row = rows.find(r => r['testcaseid'] === testcaseid);
  if (!row) throw new Error(`Test case '${testcaseid}' not found in '${filename}'`);
  return row;
}
