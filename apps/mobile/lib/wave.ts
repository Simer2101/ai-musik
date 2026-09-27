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
    needles: ['хип-хоп', 'хипхоп', 'hip-hop', 'hip hop', 'реп', 'rap'],
  },
  { id: 'rock', value: 'Рок', ru: 'Рок', en: 'Rock', needles: ['рок', 'rock'] },
  { id: 'rnb', value: 'R&B', ru: 'R&B', en: 'R&B', needles: ['r&b', 'rnb', 'соул', 'soul'] },
  {
    id: 'electronic',
    value: 'Электроника',
    ru: 'Электроника',
    en: 'Electronic',
    needles: ['электроника', 'electronic', 'edm', 'dance', 'хаус', 'house'],
  },
  {
    id: 'latin',
    value: 'Латина',
    ru: 'Латина',
    en: 'Latin',
    needles: ['латина', 'latin', 'реггетон', 'reggaeton', 'salsa'],
  },
  { id: 'indie', value: 'Инди', ru: 'Инди', en: 'Indie', needles: ['инди', 'indie'] },
  {
    id: 'classical',
    value: 'Классика',
    ru: 'Классика',
    en: 'Classical',
    needles: ['классика', 'classical', 'ноктюрн', 'адажио'],
  },
];

function extra(id: string, ru: string, en: string, needles: string[]): Genre {
  return { id, value: ru, ru, en, needles };
}

// After the eight most streamed styles, each next entry is less widely played than the one before it.
const MORE: Genre[] = [
  extra('kpop', 'K-pop', 'K-pop', ['k-pop', 'к-поп', 'кей-поп']),
  extra('country', 'Кантри', 'Country', ['кантри', 'country']),
  extra('popsa', 'Попса', 'Mainstream pop', ['попса', 'эстрада']),
  extra('metal', 'Метал', 'Metal', ['метал', 'metal']),
  extra('jazz', 'Джаз', 'Jazz', ['джаз', 'jazz']),
  extra('phonk', 'Фонк', 'Phonk', ['фонк', 'phonk']),
  extra('folk', 'Фолк', 'Folk', ['фолк', 'folk']),
  extra('reggae', 'Регги', 'Reggae', ['регги', 'reggae']),
  extra('blues', 'Блюз', 'Blues', ['блюз', 'blues']),
  extra('soul', 'Соул', 'Soul', ['нео-соул', 'neo-soul', 'соул-музыка']),
  extra('funk', 'Фанк', 'Funk', ['фанк', 'funk']),
  extra('disco', 'Диско', 'Disco', ['диско', 'disco']),
  extra('house', 'Хаус', 'House', ['хаус-музыка', 'house music']),
  extra('techno', 'Техно', 'Techno', ['техно', 'techno']),
  extra('trap', 'Трэп', 'Trap', ['трэп', 'trap']),
  extra('drill', 'Дрилл', 'Drill', ['дрилл', 'drill']),
  extra('lofi', 'Лоу-фай', 'Lo-fi', ['лоу-фай', 'lo-fi', 'lofi']),
  extra('dance', 'Дэнс', 'Dance', ['дэнс', 'dance-pop', 'dance pop']),
  extra('chanson', 'Шансон', 'Chanson', ['шансон', 'chanson']),
  extra('rusrock', 'Русский рок', 'Russian rock', ['русский рок', 'russian rock']),
  extra('punk', 'Панк', 'Punk', ['панк', 'punk']),
  extra('alternative', 'Альтернатива', 'Alternative', ['альтернатива', 'alternative']),
  extra('grunge', 'Гранж', 'Grunge', ['гранж', 'grunge']),
  extra('hardrock', 'Хард-рок', 'Hard rock', ['хард-рок', 'hard rock', 'hard-rock']),
  extra('poprock', 'Поп-рок', 'Pop rock', ['поп-рок', 'pop rock', 'pop-rock']),
  extra('acoustic', 'Акустика', 'Acoustic', ['акустика', 'acoustic']),
  extra('bard', 'Авторская песня', 'Singer-songwriter', ['авторская песня', 'бард', 'singer-songwriter']),
  extra('soundtrack', 'Саундтрек', 'Soundtrack', ['саундтрек', 'soundtrack']),
  extra('cinematic', 'Киномузыка', 'Cinematic', ['киномузыка', 'cinematic']),
  extra('gospel', 'Госпел', 'Gospel', ['госпел', 'gospel']),
  extra('opera', 'Опера', 'Opera', ['опера', 'opera']),
  extra('ambient', 'Эмбиент', 'Ambient', ['эмбиент', 'ambient']),
  extra('synthwave', 'Синтвейв', 'Synthwave', ['синтвейв', 'synthwave', 'retrowave']),
  extra('dnb', 'Драм-н-бейс', 'Drum and bass', ['драм-н-бейс', 'drum and bass', 'drum & bass', 'dnb']),
  extra('dubstep', 'Дабстеп', 'Dubstep', ['дабстеп', 'dubstep']),
  extra('trance', 'Транс', 'Trance', ['транс', 'trance']),
  extra('bigroom', 'Биг-рум', 'Big room', ['биг-рум', 'big room', 'big-room']),
  extra('deephouse', 'Дип-хаус', 'Deep house', ['дип-хаус', 'deep house', 'deep-house']),
  extra('techhouse', 'Тек-хаус', 'Tech house', ['тек-хаус', 'tech house', 'tech-house']),
  extra('frenchhouse', 'Френч-хаус', 'French house', ['френч-хаус', 'french house']),
  extra('progressive', 'Прогрессив-хаус', 'Progressive house', ['прогрессив-хаус', 'progressive house']),
  extra('tropical', 'Тропикал-хаус', 'Tropical house', ['тропикал-хаус', 'tropical house']),
  extra('futurebass', 'Фьюче-бейс', 'Future bass', ['фьюче-бейс', 'future bass']),
  extra('hardstyle', 'Хардстайл', 'Hardstyle', ['хардстайл', 'hardstyle']),
  extra('psytrance', 'Псайтранс', 'Psytrance', ['псайтранс', 'psytrance']),
  extra('boombap', 'Бум-бэп', 'Boom bap', ['бум-бэп', 'boom-bap']),
  extra('cloudrap', 'Клауд-рэп', 'Cloud rap', ['клауд-рэп', 'cloud rap']),
  extra('grime', 'Грайм', 'Grime', ['грайм', 'grime']),
  extra('ukgarage', 'UK-гэридж', 'UK garage', ['uk-гэридж', 'uk garage', 'uk-garage']),
  extra('triphop', 'Трип-хоп', 'Trip hop', ['трип-хоп', 'trip hop', 'trip-hop']),
  extra('chillout', 'Чиллаут', 'Chillout', ['чиллаут', 'chillout', 'chill-out']),
  extra('hyperpop', 'Гиперпоп', 'Hyperpop', ['гиперпоп', 'hyperpop']),
  extra('bedroom', 'Бедрум-поп', 'Bedroom pop', ['бедрум-поп', 'bedroom pop']),
  extra('dreampop', 'Дрим-поп', 'Dream pop', ['дрим-поп', 'dream pop', 'dream-pop']),
  extra('indiefolk', 'Инди-фолк', 'Indie folk', ['инди-фолк', 'indie folk', 'indie-folk']),
  extra('synthpop', 'Синти-поп', 'Synthpop', ['синти-поп', 'synthpop', 'synth-pop']),
  extra('newwave', 'Нью-вейв', 'New wave', ['нью-вейв', 'new wave', 'new-wave']),
  extra('eurodance', 'Евроденс', 'Eurodance', ['евроденс', 'eurodance']),
  extra('italo', 'Итало-диско', 'Italo disco', ['итало-диско', 'italo disco', 'italo-disco']),
  extra('vaporwave', 'Вейпорвейв', 'Vaporwave', ['вейпорвейв', 'vaporwave']),
  extra('chiptune', 'Чиптюн', 'Chiptune', ['чиптюн', 'chiptune', '8-bit', '8 бит']),
  extra('emo', 'Эмо', 'Emo', ['эмо', 'emo']),
  extra('postpunk', 'Пост-панк', 'Post-punk', ['пост-панк', 'post-punk', 'post punk']),
  extra('shoegaze', 'Шугейз', 'Shoegaze', ['шугейз', 'shoegaze']),
  extra('psychedelic', 'Психоделика', 'Psychedelic', ['психоделика', 'psychedelic']),
  extra('numetal', 'Ню-метал', 'Nu metal', ['ню-метал', 'nu metal', 'nu-metal']),
  extra('metalcore', 'Металкор', 'Metalcore', ['металкор', 'metalcore']),
  extra('deathmetal', 'Дэт-метал', 'Death metal', ['дэт-метал', 'death metal']),
  extra('blackmetal', 'Блэк-метал', 'Black metal', ['блэк-метал', 'black metal']),
  extra('powermetal', 'Пауэр-метал', 'Power metal', ['пауэр-метал', 'power metal']),
  extra('symphonic', 'Симфо-метал', 'Symphonic metal', ['симфо-метал', 'symphonic metal']),
  extra('ska', 'Ска', 'Ska', ['ска', 'ska']),
  extra('dancehall', 'Дэнсхолл', 'Dancehall', ['дэнсхолл', 'dancehall']),
  extra('amapiano', 'Амапиано', 'Amapiano', ['амапиано', 'amapiano']),
  extra('afrobeats', 'Афробит', 'Afrobeats', ['афробит', 'afrobeats', 'afrobeat']),
  extra('salsa', 'Сальса', 'Salsa', ['сальса']),
  extra('bachata', 'Бачата', 'Bachata', ['бачата', 'bachata']),
  extra('samba', 'Самба', 'Samba', ['самба', 'samba']),
  extra('bossa', 'Босса-нова', 'Bossa nova', ['босса-нова', 'bossa nova', 'bossa-nova']),
  extra('flamenco', 'Фламенко', 'Flamenco', ['фламенко', 'flamenco']),
  extra('tango', 'Танго', 'Tango', ['танго', 'tango']),
  extra('cumbia', 'Кумбия', 'Cumbia', ['кумбия', 'cumbia']),
  extra('kizomba', 'Кизомба', 'Kizomba', ['кизомба', 'kizomba']),
  extra('sertanejo', 'Сертанежу', 'Sertanejo', ['сертанежу', 'sertanejo']),
  extra('mariachi', 'Мариачи', 'Mariachi', ['мариачи', 'mariachi']),
  extra('corridos', 'Корридос', 'Corridos', ['корридос', 'corridos']),
  extra('bollywood', 'Болливуд', 'Bollywood', ['болливуд', 'bollywood']),
  extra('jpop', 'J-pop', 'J-pop', ['j-pop', 'джей-поп']),
  extra('citypop', 'Сити-поп', 'City pop', ['сити-поп', 'city pop', 'city-pop']),
  extra('anime', 'Аниме', 'Anime', ['аниме', 'anime']),
  extra('celtic', 'Кельтика', 'Celtic', ['кельтика', 'celtic']),
  extra('balkan', 'Балканская', 'Balkan', ['балканская', 'balkan']),
  extra('schlager', 'Шлягер', 'Schlager', ['шлягер', 'schlager']),
  extra('arabic', 'Арабская поп', 'Arabic pop', ['арабская поп', 'arabic pop']),
  extra('eastern', 'Восточная', 'Middle Eastern', ['восточная', 'middle eastern']),
  extra('fado', 'Фаду', 'Fado', ['фаду', 'fado']),
  extra('rai', 'Раи', 'Raï', ['раи', 'rai']),
  extra('highlife', 'Хайлайф', 'Highlife', ['хайлайф', 'highlife']),
  extra('bluegrass', 'Блюграсс', 'Bluegrass', ['блюграсс', 'bluegrass']),
  extra('swing', 'Свинг', 'Swing', ['свинг', 'swing']),
  extra('smoothjazz', 'Смус-джаз', 'Smooth jazz', ['смус-джаз', 'smooth jazz']),
  extra('bebop', 'Бибоп', 'Bebop', ['бибоп', 'bebop']),
  extra('jazzhop', 'Джаз-хоп', 'Jazz hop', ['джаз-хоп', 'jazz hop', 'jazz-hop']),
  extra('piano', 'Фортепиано', 'Piano', ['фортепиано', 'piano solo']),
  extra('orchestra', 'Оркестр', 'Orchestra', ['оркестр', 'orchestra']),
  extra('choir', 'Хор', 'Choir', ['хор', 'choir']),
  extra('meditation', 'Медитация', 'Meditation', ['медитация', 'meditation']),
  extra('lullaby', 'Колыбельная', 'Lullaby', ['колыбельная', 'lullaby']),
  extra('waltz', 'Вальс', 'Waltz', ['вальс', 'waltz']),
  extra('march', 'Марш', 'March', ['марш', 'march']),
  extra('newage', 'Нью-эйдж', 'New age', ['нью-эйдж', 'new age']),
  extra('ethnic', 'Этника', 'World', ['этника', 'world music']),
  extra('folktrad', 'Народная', 'Traditional folk', ['народная', 'traditional folk']),
  extra('epic', 'Эпик', 'Epic', ['эпик', 'epic trailer', 'trailer music']),
  extra('game', 'Игровая', 'Video game', ['игровая', 'video game', 'chiptune ost']),
  extra('nightcore', 'Найткор', 'Nightcore', ['найткор', 'nightcore']),
  extra('drift', 'Дрифт-фонк', 'Drift phonk', ['дрифт-фонк', 'drift phonk']),
  extra('industrial', 'Индастриал', 'Industrial', ['индастриал', 'industrial']),
  extra('experimental', 'Экспериментальная', 'Experimental', ['экспериментальная', 'experimental']),
  extra('noise', 'Нойз', 'Noise', ['нойз', 'noise']),
  extra('minimal', 'Минимал', 'Minimal', ['минимал', 'minimal techno']),
  extra('breakbeat', 'Брейкбит', 'Breakbeat', ['брейкбит', 'breakbeat']),
  extra('jungle', 'Джангл', 'Jungle', ['джангл', 'jungle']),
  extra('dub', 'Даб', 'Dub', ['даб', 'dub']),
  extra('garagerock', 'Гараж-рок', 'Garage rock', ['гараж-рок', 'garage rock']),
  extra('bluesrock', 'Блюз-рок', 'Blues rock', ['блюз-рок', 'blues rock']),
  extra('folkrock', 'Фолк-рок', 'Folk rock', ['фолк-рок', 'folk rock']),
  extra('poppunk', 'Поп-панк', 'Pop punk', ['поп-панк', 'pop punk', 'pop-punk']),
  extra('screamo', 'Скримо', 'Screamo', ['скримо', 'screamo']),
  extra('postrock', 'Пост-рок', 'Post-rock', ['пост-рок', 'post-rock', 'post rock']),
  extra('mathrock', 'Мат-рок', 'Math rock', ['мат-рок', 'math rock']),
  extra('forro', 'Форро', 'Forró', ['форро', 'forro', 'forró']),
  extra('zouk', 'Зук', 'Zouk', ['зук', 'zouk']),
  extra('discopolo', 'Диско-поло', 'Disco polo', ['диско-поло', 'disco polo']),
];

export const GENRES: Genre[] = [...MAIN, ...MORE];

export const MAIN_GENRE_COUNT = MAIN.length;

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
