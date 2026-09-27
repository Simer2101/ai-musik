import { DEFAULT_GENRE } from './wave';
import type { Profile, Track, TrackComment } from './types';

export const DEMO_EMAIL = 'demo@aimusik.app';
export const DEMO_PASSWORD = 'aimusik';
export const DEMO_NAME = 'Демо-слушатель';
export const DEMO_USER_ID = 'demo-user';
export const DEMO_SESSION_KEY = 'aimusik.demo.session';

const SAMPLE_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

function track(
  partial: Omit<Track, 'aiGenerated' | 'liked' | 'isPublic' | 'status' | 'errorMessage' | 'instrumental' | 'audioUrl'> &
    Partial<Track>
): Track {
  return {
    aiGenerated: true,
    liked: false,
    isPublic: true,
    status: 'ready',
    errorMessage: null,
    instrumental: true,
    audioUrl: SAMPLE_AUDIO,
    ...partial,
  };
}

const seedTracks: Track[] = [
  track({
    id: 'demo-afterglow',
    userId: 'demo-other',
    authorName: 'Орбита',
    title: 'Послесвечение',
    prompt: 'Летний поп, яркий хук, тёплые синтезаторы, 118 BPM',
    playCount: 2590,
    genre: 'Поп',
    durationMs: 98000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverUrl: null,
    likeCount: 37,
    createdAt: new Date(Date.now() - 40000_000).toISOString(),
  }),
  track({
    id: 'demo-rain-lofi',
    userId: 'demo-other',
    authorName: 'Нова',
    title: 'Сахарный свет',
    prompt: 'Лёгкий поп, тёплый вокал-пэд, летний хит, 112 BPM',
    playCount: 3412,
    genre: 'Поп',
    durationMs: 60000,
    coverUrl: null,
    likeCount: 41,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  }),
  track({
    id: 'demo-city-hop',
    userId: 'demo-other',
    authorName: 'Кирпич',
    title: 'Кирпичный двор',
    prompt: 'Городской хип-хоп, пыльный бит, тёплый бас, инструментал',
    playCount: 2201,
    genre: 'Хип-хоп',
    durationMs: 70000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: null,
    likeCount: 22,
    createdAt: new Date(Date.now() - 9800_000).toISOString(),
  }),
  track({
    id: 'demo-asphalt-96',
    userId: 'demo-other',
    authorName: 'Квартал',
    title: 'Асфальт 96',
    prompt: 'Хип-хоп, boom bap, пыльные ударные, тёплый бас, без слов',
    playCount: 2860,
    genre: 'Хип-хоп',
    durationMs: 84000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverUrl: null,
    likeCount: 48,
    createdAt: new Date(Date.now() - 45000_000).toISOString(),
  }),
  track({
    id: 'demo-neon-rock',
    userId: 'demo-other',
    authorName: 'Искра',
    title: 'Неон и ржавчина',
    prompt: 'Неоновый рок, грязная гитара, быстрый бой, без слов',
    playCount: 1540,
    genre: 'Рок',
    durationMs: 80000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: null,
    likeCount: 14,
    createdAt: new Date(Date.now() - 5400_000).toISOString(),
  }),
  track({
    id: 'demo-city-thunder',
    userId: 'demo-other',
    authorName: 'Гром',
    title: 'Громче, чем город',
    prompt: 'Гаражный рок, грязная гитара, быстрый бой, без вокала',
    playCount: 1677,
    genre: 'Рок',
    durationMs: 91000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    coverUrl: null,
    likeCount: 29,
    createdAt: new Date(Date.now() - 56000_000).toISOString(),
  }),
  track({
    id: 'demo-velvet-sad',
    userId: 'demo-other',
    authorName: 'Нова',
    title: 'Бархат',
    prompt: 'Медленный R&B, тёплый бас, соул-аккорды, мягкий вокс',
    playCount: 1877,
    genre: 'R&B',
    durationMs: 88000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: null,
    likeCount: 56,
    createdAt: new Date(Date.now() - 26000_000).toISOString(),
  }),
  track({
    id: 'demo-black-smoke',
    userId: 'demo-other',
    authorName: 'Смола',
    title: 'Полночь',
    prompt: 'Ночной R&B, глубокий бас, соул, медленный groove',
    playCount: 1944,
    genre: 'R&B',
    durationMs: 78000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    coverUrl: null,
    likeCount: 31,
    createdAt: new Date(Date.now() - 50000_000).toISOString(),
  }),
  track({
    id: 'demo-night-drive',
    userId: DEMO_USER_ID,
    authorName: DEMO_NAME,
    title: 'Ночной разгон',
    prompt: 'Электронная танцевальная, аналоговый бас, 124 BPM',
    playCount: 1284,
    genre: 'Электроника',
    durationMs: 45000,
    coverUrl: null,
    likeCount: 18,
    liked: true,
    createdAt: new Date().toISOString(),
  }),
  track({
    id: 'demo-orbit-house',
    userId: 'demo-other',
    authorName: 'Орбита',
    title: 'Орбита 04',
    prompt: 'Электронная музыка, ровный кик, блестящие хэты, EDM',
    playCount: 902,
    genre: 'Электроника',
    durationMs: 90000,
    coverUrl: null,
    likeCount: 27,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  }),
  track({
    id: 'demo-rush-house',
    userId: DEMO_USER_ID,
    authorName: DEMO_NAME,
    title: 'Соль и солнце',
    prompt: 'Латина, реггетон-бит, тёплые гитары, 96 BPM',
    playCount: 633,
    genre: 'Латина',
    durationMs: 76000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverUrl: null,
    likeCount: 19,
    createdAt: new Date(Date.now() - 30000_000).toISOString(),
  }),
  track({
    id: 'demo-late-cipher',
    userId: DEMO_USER_ID,
    authorName: DEMO_NAME,
    title: 'Калле',
    prompt: 'Латинский поп, перкуссия, летний ритм, латина',
    playCount: 1210,
    genre: 'Латина',
    durationMs: 72000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    coverUrl: null,
    likeCount: 17,
    createdAt: new Date(Date.now() - 52000_000).toISOString(),
  }),
  track({
    id: 'demo-soft-focus',
    userId: 'demo-other',
    authorName: 'Тишина',
    title: 'Мягкий фокус',
    prompt: 'Инди, живая гитара, мягкий зал, спокойный темп',
    playCount: 4108,
    genre: 'Инди',
    durationMs: 150000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: null,
    likeCount: 33,
    createdAt: new Date(Date.now() - 20000_000).toISOString(),
  }),
  track({
    id: 'demo-last-string',
    userId: 'demo-other',
    authorName: 'Струна',
    title: 'Последняя струна',
    prompt: 'Инди, живая гитара, широкий зал, инструментал',
    playCount: 988,
    genre: 'Инди',
    durationMs: 104000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    coverUrl: null,
    likeCount: 21,
    createdAt: new Date(Date.now() - 60000_000).toISOString(),
  }),
  track({
    id: 'demo-nocturne-c',
    userId: 'demo-other',
    authorName: 'Камертон',
    title: 'Ноктюрн',
    prompt: 'Классика, соло-рояль, ноктюрн, совсем без слов',
    playCount: 2410,
    genre: 'Классика',
    durationMs: 132000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    coverUrl: null,
    likeCount: 44,
    createdAt: new Date(Date.now() - 64000_000).toISOString(),
  }),
  track({
    id: 'demo-cinema-dawn',
    userId: DEMO_USER_ID,
    authorName: DEMO_NAME,
    title: 'Рассвет в кадре',
    prompt: 'Классика, струнные, кинематограф, медленное нарастание',
    playCount: 744,
    genre: 'Классика',
    durationMs: 110000,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: null,
    likeCount: 11,
    createdAt: new Date(Date.now() - 12000_000).toISOString(),
  }),
];

const DEMO_COMMENTS: Record<string, TrackComment[]> = {
  'demo-night-drive': [
    { id: 'c1', author: 'Мира', text: 'Это как Яндекс.Волна, только всё своё.' },
    { id: 'c2', author: 'Лев', text: 'Бас очень плотный. Кручу в машине.' },
  ],
  'demo-rain-lofi': [
    { id: 'c3', author: 'Соня', text: 'Идеально под работу. Как фокус-волна.' },
  ],
  'demo-neon-rock': [
    { id: 'c4', author: 'Искра', text: 'Гитара грязная в хорошем смысле.' },
    { id: 'c5', author: 'Кирилл', text: 'Хочу такой же промпт себе.' },
  ],
  'demo-asphalt-96': [{ id: 'c6', author: 'Марк', text: 'Бит как с кассеты. Кручу по кругу.' }],
  'demo-nocturne-c': [{ id: 'c7', author: 'Ева', text: 'Рояль очень чистый. Как зал без публики.' }],
  'demo-still-air': [{ id: 'c8', author: 'Оля', text: 'Ни одного слова. Идеально под работу.' }],
};

export function commentsFor(trackId: string): TrackComment[] {
  return (
    DEMO_COMMENTS[trackId] ?? [
      { id: `c-${trackId}`, author: 'Аня', text: 'Звучит свежо. Оставляю в избранном.' },
    ]
  );
}

const catalog = [...seedTracks];
const likedIds = new Set<string>(['demo-night-drive']);

function withLikes(items: Track[]): Track[] {
  return items.map((item) => ({ ...item, liked: likedIds.has(item.id) }));
}

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  displayName: DEMO_NAME,
  avatarUrl: null,
  generationsUsedToday: 1,
  dailyGenerationLimit: 3,
};

export const demoApi = {
  feed: () => ({ tracks: withLikes(catalog) }),
  track: (id: string) => {
    const found = catalog.find((item) => item.id === id);
    if (!found) throw new Error('Track not found');
    return { track: { ...found, liked: likedIds.has(found.id) } };
  },
  createTrack: (payload: {
    prompt: string;
    genre?: string;
    durationMs?: number;
    instrumental?: boolean;
  }) => {
    const created = track({
      id: `demo-${Date.now()}`,
      userId: DEMO_USER_ID,
      authorName: DEMO_NAME,
      title: payload.prompt.slice(0, 28),
      prompt: payload.prompt,
      genre: payload.genre ?? DEFAULT_GENRE,
      playCount: 0,
      durationMs: payload.durationMs ?? 30000,
      instrumental: payload.instrumental ?? true,
      likeCount: 0,
      coverUrl: null,
      createdAt: new Date().toISOString(),
    });
    catalog.unshift(created);
    return { track: created };
  },
  me: () => demoProfile,
  myTracks: () => ({
    tracks: withLikes(catalog.filter((item) => item.userId === DEMO_USER_ID)),
  }),
  myLikes: () => ({
    tracks: withLikes(catalog.filter((item) => likedIds.has(item.id))),
  }),
  like: (id: string) => {
    likedIds.add(id);
    const found = catalog.find((item) => item.id === id);
    if (found) found.likeCount += 1;
    return { ok: true };
  },
  unlike: (id: string) => {
    likedIds.delete(id);
    const found = catalog.find((item) => item.id === id);
    if (found) found.likeCount = Math.max(0, found.likeCount - 1);
    return { ok: true };
  },
  report: () => ({ ok: true }),
  deleteAccount: () => ({ ok: true }),
};

export function isDemoLogin(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}
