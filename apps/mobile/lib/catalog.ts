import type { Track } from './types';

const GITHUB_CATALOG_URL =
  process.env.EXPO_PUBLIC_GITHUB_CATALOG_URL ??
  'https://raw.githubusercontent.com/Simer2101/ai-musik/main/catalog/tracks.json';

export async function loadGithubCatalog(): Promise<Track[]> {
  try {
    const response = await fetch(`${GITHUB_CATALOG_URL}?t=${Date.now()}`);
    if (!response.ok) return [];
    const body = (await response.json()) as { tracks?: Track[] };
    return body.tracks ?? [];
  } catch {
    return [];
  }
}

export function mergeTracks(...lists: Track[][]) {
  const seen = new Set<string>();
  const merged: Track[] = [];
  for (const list of lists) {
    for (const track of list) {
      if (seen.has(track.id)) continue;
      seen.add(track.id);
      merged.push(track);
    }
  }
  return merged;
}
