import type { Dictionary } from './i18n';
import type { Track } from './types';

export type Genre = {
  id: string;
  value: string;
  ru: string;
  en: string;
  needles: string[];
};

const MAIN: Genre[] = [
  { id: 'pop', value: 'Поп', ru: 'Поп', en: 'Pop', needles: ['поп', 'pop'] },
  {
    id: 'hiphop',
    value: 'Хип-хоп',
    ru: 'Хип-хоп',
    en: 'Hip-Hop',
    needles: ['хип-хоп', 'хипхоп', 'hip-hop', 'hip hop', 'реп', 'rap', 'рэп', 'трэп', 'trap', 'дрилл', 'drill', 'фонк', 'phonk'],
  },
  { id: 'rock', value: 'Рок', ru: 'Рок', en: 'Rock', needles: ['рок', 'rock', 'панк', 'punk', 'гранж', 'grunge'] },
  { id: 'rnb', value: 'R&B', ru: 'R&B', en: 'R&B', needles: ['r&b', 'rnb', 'соул', 'soul', 'фанк', 'funk'] },
  {
    id: 'electronic',
    value: 'Электроника',
    ru: 'Электроника',
    en: 'Electronic',
    needles: ['электроника', 'electronic', 'edm', 'dance', 'хаус', 'house', 'техно', 'techno', 'транс', 'trance', 'drum and bass', 'dnb', 'лоу-фай', 'lo-fi', 'lofi', 'эмбиент', 'ambient', 'диско', 'disco'],
  },
  {
    id: 'latin',
    value: 'Латина',
    ru: 'Латина',
    en: 'Latin',
    needles: ['латина', 'latin', 'реггетон', 'reggaeton', 'salsa', 'сальса', 'бачата', 'bachata', 'кумбия', 'cumbia'],
  },
  { id: 'indie', value: 'Инди', ru: 'Инди', en: 'Indie', needles: ['инди', 'indie', 'альтернатива', 'alternative'] },
  {
    id: 'classical',
    value: 'Классика',
    ru: 'Классика',
    en: 'Classical',
    needles: ['классика', 'classical', 'ноктюрн', 'адажио', 'опера', 'opera', 'саундтрек', 'soundtrack', 'киномузыка', 'cinematic'],
  },
];

function extra(id: string, ru: string, en: string, needles: string[]): Genre {
  return { id, value: ru, ru, en, needles };
}

// The eight most streamed styles above, then the next most played worldwide, most popular first.
// Sub-genres are not listed separately: their names are needles of the closest main genre.
const MORE: Genre[] = [
  extra('kpop', 'K-pop', 'K-pop', ['k-pop', 'к-поп', 'кей-поп', 'j-pop', 'джей-поп']),
  extra('country', 'Кантри', 'Country', ['кантри', 'country', 'bluegrass', 'блюграсс']),
  extra('metal', 'Метал', 'Metal', ['метал', 'metal', 'металкор', 'metalcore']),
  extra('afrobeats', 'Афробит', 'Afrobeats', ['афробит', 'afrobeats', 'afrobeat', 'амапиано', 'amapiano']),
  extra('jazz', 'Джаз', 'Jazz', ['джаз', 'jazz', 'блюз', 'blues', 'свинг', 'swing']),
  extra('reggae', 'Регги', 'Reggae', ['регги', 'reggae', 'дэнсхолл', 'dancehall']),
  extra('folk', 'Фолк', 'Folk', ['фолк', 'folk', 'акустика', 'acoustic']),
];

export const GENRES: Genre[] = [...MAIN, ...MORE];

export const DEFAULT_GENRE = GENRES[0].value;

export function genreLabel(genre: string | null | undefined, t: Dictionary) {
  const found = GENRES.find((item) => item.value === genre || item.id === genre);
  if (!found) return genre ?? '';
  return t.genre === 'Genre' ? found.en : found.ru;
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
