import { Image, type ImageSourcePropType } from 'react-native';

import type { Track } from './types';

export const COVER_ASSETS: Record<string, ImageSourcePropType> = {
  'demo-night-drive': require('../assets/covers/cover-night-drive.png'),
  'demo-rain-lofi': require('../assets/covers/cover-rain-lofi.png'),
  'demo-orbit-house': require('../assets/covers/cover-orbit-house.png'),
  'demo-forest-ambient': require('../assets/covers/cover-forest.png'),
  'demo-neon-rock': require('../assets/covers/cover-neon-rock.png'),
  'demo-city-hop': require('../assets/covers/cover-city-hop.png'),
  'demo-cinema-dawn': require('../assets/covers/cover-cinema-dawn.png'),
  'demo-soft-focus': require('../assets/covers/cover-soft-focus.png'),
  'demo-velvet-sad': require('../assets/covers/cover-velvet.png'),
  'demo-rush-house': require('../assets/covers/cover-rush.png'),
  'demo-afterglow': require('../assets/covers/cover-afterglow.png'),
  'demo-asphalt-96': require('../assets/covers/cover-city-hop.png'),
  'demo-city-thunder': require('../assets/covers/cover-neon-rock.png'),
  'demo-black-smoke': require('../assets/covers/cover-velvet.png'),
  'demo-late-cipher': require('../assets/covers/cover-rush.png'),
  'demo-last-string': require('../assets/covers/cover-soft-focus.png'),
  'demo-nocturne-c': require('../assets/covers/cover-forest.png'),
};

export const AVATAR_DEMO = require('../assets/covers/avatar-demo.png');

// Bundled images resolve to a real URL in both the dev server and an exported web build.
function assetUri(source: ImageSourcePropType | string): string | null {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return Image.resolveAssetSource(source)?.uri ?? null;
  if (source && !Array.isArray(source) && 'uri' in source) return source.uri ?? null;
  return null;
}

export const AVATAR_URI = assetUri(AVATAR_DEMO) ?? undefined;

export function coverUri(track: Track) {
  const asset = COVER_ASSETS[track.id];
  if (asset) return assetUri(asset);
  return track.coverUrl;
}

const PALETTES = [
  ['#1b1030', '#8b7cff'],
  ['#1a1208', '#f97316'],
  ['#0c1a14', '#3ee0c0'],
  ['#1a1024', '#e879f9'],
  ['#1a0b12', '#fb7185'],
  ['#0c1224', '#38bdf8'],
  ['#14180c', '#86efac'],
  ['#12081c', '#6366f1'],
];

export function trackTitle(track: Track) {
  return track.title || track.genre || 'Sonari';
}

export function coverColors(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length] as [string, string];
}

export function coverSource(track: Track): ImageSourcePropType | null {
  if (COVER_ASSETS[track.id]) return COVER_ASSETS[track.id];
  if (track.coverUrl) return { uri: track.coverUrl };
  return null;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
