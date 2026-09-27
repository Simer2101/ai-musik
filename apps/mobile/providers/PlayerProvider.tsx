import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { shuffleTracks } from '@/lib/wave';
import type { Track } from '@/lib/types';

type PlayerContextValue = {
  track: Track | null;
  queue: Track[];
  recents: Track[];
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  shuffle: boolean;
  repeat: boolean;
  radio: boolean;
  play: (track: Track, queue?: Track[], options?: { radio?: boolean; autoplay?: boolean }) => Promise<void>;
  toggle: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const trackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const shuffleRef = useRef(false);
  const repeatRef = useRef(false);
  const radioRef = useRef(false);

  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [recents, setRecents] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [radio, setRadio] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
    }).catch(() => undefined);

    return () => {
      soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  const remember = (next: Track) => {
    setRecents((current) => [next, ...current.filter((item) => item.id !== next.id)].slice(0, 12));
  };

  const load = async (next: Track, shouldPlay = true) => {
    if (!next.audioUrl) throw new Error('Этот трек ещё не готов');
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: next.audioUrl },
      { shouldPlay, progressUpdateIntervalMillis: 400 },
      (status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        setPositionMs(status.positionMillis);
        setDurationMs(status.durationMillis ?? next.durationMs);
        if (status.didJustFinish) {
          if (repeatRef.current) {
            void sound.setPositionAsync(0);
            void sound.playAsync();
            return;
          }
          void step(1);
        }
      }
    );
    soundRef.current = sound;
    trackRef.current = next;
    setTrack(next);
    setIsPlaying(shouldPlay);
    if (shouldPlay) remember(next);
  };

  const step = async (direction: number) => {
    const currentQueue = queueRef.current;
    const current = trackRef.current;
    if (currentQueue.length === 0) return;
    const index = Math.max(
      0,
      currentQueue.findIndex((item) => item.id === current?.id)
    );
    let nextIndex = index + direction;
    if (radioRef.current || shuffleRef.current) {
      if (nextIndex >= currentQueue.length || nextIndex < 0) {
        const reshuffled = shuffleTracks(currentQueue);
        queueRef.current = reshuffled;
        setQueue(reshuffled);
        nextIndex = 0;
      }
    } else if (nextIndex >= currentQueue.length || nextIndex < 0) {
      setIsPlaying(false);
      return;
    }
    await load(queueRef.current[nextIndex], true);
  };

  const value = useMemo<PlayerContextValue>(
    () => ({
      track,
      queue,
      recents,
      isPlaying,
      positionMs,
      durationMs,
      shuffle,
      repeat,
      radio,
      play: async (next, nextQueue, options) => {
        const ready = (nextQueue ?? queueRef.current).filter(
          (item) => item.status === 'ready' && item.audioUrl
        );
        const list = shuffleRef.current ? shuffleTracks(ready) : ready;
        queueRef.current = list.length ? list : [next];
        setQueue(queueRef.current);
        radioRef.current = Boolean(options?.radio);
        setRadio(radioRef.current);
        await load(next, options?.autoplay !== false);
      },
      toggle: async () => {
        if (!soundRef.current) {
          if (trackRef.current?.audioUrl) await load(trackRef.current, true);
          return;
        }
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) {
          if (trackRef.current?.audioUrl) await load(trackRef.current, true);
          return;
        }
        if (status.isPlaying) await soundRef.current.pauseAsync();
        else await soundRef.current.playAsync();
      },
      seek: async (ms) => {
        await soundRef.current?.setPositionAsync(ms);
      },
      next: async () => step(1),
      prev: async () => {
        if (positionMs > 4000) {
          await soundRef.current?.setPositionAsync(0);
          return;
        }
        await step(-1);
      },
      toggleShuffle: () => {
        shuffleRef.current = !shuffleRef.current;
        setShuffle(shuffleRef.current);
        if (shuffleRef.current && queueRef.current.length) {
          const shuffled = shuffleTracks(queueRef.current);
          queueRef.current = shuffled;
          setQueue(shuffled);
        }
      },
      toggleRepeat: () => {
        repeatRef.current = !repeatRef.current;
        setRepeat(repeatRef.current);
      },
    }),
    [durationMs, isPlaying, positionMs, queue, radio, recents, repeat, shuffle, track]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
