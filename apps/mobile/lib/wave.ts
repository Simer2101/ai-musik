import type { Dictionary } from './i18n';
import type { Track } from './types';

export type GenreId =
  | 'pop'
  | 'hiphop'
  | 'rock'
  | 'rnb'
  | 'electronic'
  | 'latin'
  | 'indie'
  | 'classical';

export const GENRES: {
  id: GenreId;
  value: string;
  labelKey: keyof Dictionary;
  needles: string[];
}[] = [
  { id: 'pop', value: 'Поп', labelKey: 'stylePop', needles: ['поп', 'pop'] },
  {
    id: 'hiphop',
    value: 'Хип-хоп',
    labelKey: 'styleHipHop',
    needles: ['хип-хоп', 'хипхоп', 'hip-hop', 'hip hop', 'реп', 'rap'],
  },
  { id: 'rock', value: 'Рок', labelKey: 'styleRock', needles: ['рок', 'rock'] },
  { id: 'rnb', value: 'R&B', labelKey: 'styleRnb', needles: ['r&b', 'rnb', 'соул', 'soul'] },
  {
    id: 'electronic',
    value: 'Электроника',
    labelKey: 'styleElectronic',
    needles: ['электроника', 'electronic', 'edm', 'dance', 'хаус', 'house'],
  },
  {
    id: 'latin',
    value: 'Латина',
    labelKey: 'styleLatin',
    needles: ['латина', 'latin', 'реггетон', 'reggaeton', 'salsa'],
  },
  { id: 'indie', value: 'Инди', labelKey: 'styleIndie', needles: ['инди', 'indie'] },
  {
    id: 'classical',
    value: 'Классика',
    labelKey: 'styleClassical',
    needles: ['классика', 'classical', 'ноктюрн', 'адажио'],
  },
];

export const DEFAULT_GENRE = GENRES[0].value;

export function genreLabel(genre: string | null | undefined, t: Dictionary) {
  const found = GENRES.find((item) => item.value === genre || item.id === genre);
  return found ? String(t[found.labelKey]) : genre ?? '';
}

export type Mood = 'calm' | 'energy' | 'night' | 'focus' | 'sad';

const MOOD_GENRES: Record<Mood, string[]> = {
  calm: ['поп', 'pop', 'r&b', 'инди', 'indie', 'классика', 'classical', 'латина', 'latin'],
  energy: ['хип-хоп', 'hip-hop', 'рок', 'rock', 'электроника', 'electronic', 'поп', 'pop', 'латина', 'latin'],
  night: ['r&b', 'электроника', 'electronic', 'поп', 'pop', 'латина', 'latin', 'хип-хоп'],
  focus: ['классика', 'classical', 'инди', 'indie', 'электроника', 'electronic'],
  sad: ['r&b', 'инди', 'indie', 'классика', 'classical', 'поп', 'pop'],
};

export function filterByNeedles(tracks: Track[], needles: string[]) {
  const ready = tracks.filter((item) => item.status === 'ready' && item.audioUrl);
  return ready.filter((item) => {
    const hay = `${item.genre ?? ''} ${item.prompt} ${item.title ?? ''}`.toLowerCase();
    return needles.some((needle) => hay.includes(needle));
  });
}

export function filterByMood(tracks: Track[], mood: Mood | null) {
  const ready = tracks.filter((item) => item.status === 'ready' && item.audioUrl);
  if (!mood) return ready;
  const needles = MOOD_GENRES[mood];
  const matched = ready.filter((item) => {
    const hay = `${item.genre ?? ''} ${item.prompt}`.toLowerCase();
    return needles.some((needle) => hay.includes(needle));
  });
  return matched.length > 0 ? matched : ready;
}

export function shuffleTracks(tracks: Track[]) {
  const copy = [...tracks];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function searchTracks(tracks: Track[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((item) =>
    [item.title, item.genre, item.prompt, item.authorName].some((value) =>
      (value ?? '').toLowerCase().includes(q)
    )
  );
}

export function greetingKey(hour = new Date().getHours()) {
  if (hour < 6) return 'helloNight' as const;
  if (hour < 12) return 'helloMorning' as const;
  if (hour < 18) return 'helloDay' as const;
  if (hour < 23) return 'helloEvening' as const;
  return 'helloNight' as const;
}
