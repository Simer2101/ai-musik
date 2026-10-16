import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { coverUri, trackTitle } from '@/lib/cover';
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
  const soundRef = useRef<AudioPlayer | null>(null);
  const trackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const shuffleRef = useRef(false);
  const repeatRef = useRef(false);
  const radioRef = useRef(false);
  // A seek asked for before the new track has loaded; applied as soon as it can be.
  const pendingSeekRef = useRef<number | null>(null);

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
    // Lock screen controls need 'doNotMix'; without them Android stops background audio after ~3 min.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => undefined);

    return () => {
      soundRef.current?.remove();
      soundRef.current = null;
    };
  }, []);

  const remember = (next: Track) => {
    setRecents((current) => [next, ...current.filter((item) => item.id !== next.id)].slice(0, 12));
  };

  const load = async (next: Track, shouldPlay = true) => {
    if (!next.audioUrl) throw new Error('Этот трек ещё не готов');
    if (soundRef.current) {
      soundRef.current.remove();
      soundRef.current = null;
    }
    pendingSeekRef.current = null;
    // expo-audio reports time in seconds; the rest of the app works in milliseconds.
    const sound = createAudioPlayer({ uri: next.audioUrl }, { updateInterval: 400 });
    sound.addListener('playbackStatusUpdate', (status) => {
      if (!status.isLoaded) return;
      if (pendingSeekRef.current !== null) {
        const target = pendingSeekRef.current;
        pendingSeekRef.current = null;
        void sound.seekTo(target / 1000);
        return;
      }
      setIsPlaying(status.playing);
      setPositionMs(Math.round(status.currentTime * 1000));
      setDurationMs(status.duration > 0 ? Math.round(status.duration * 1000) : next.durationMs);
      if (status.didJustFinish) {
        if (repeatRef.current) {
          void sound.seekTo(0).then(() => sound.play());
          return;
        }
        void step(1);
      }
    });
    const artwork = coverUri(next);
    sound.setActiveForLockScreen(true, {
      title: trackTitle(next),
      artist: next.authorName,
      artworkUrl: artwork?.startsWith('http') ? artwork : undefined,
    });
    if (shouldPlay) sound.play();
    soundRef.current = sound;
    setPositionMs(0);
    setDurationMs(next.durationMs);
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
        if (soundRef.current.playing) soundRef.current.pause();
        else soundRef.current.play();
      },
      seek: async (ms) => {
        const sound = soundRef.current;
        if (!sound) return;
        // Move the clock now so the bar does not jump back until the next status update.
        setPositionMs(ms);
        if (!sound.isLoaded) {
          pendingSeekRef.current = ms;
          return;
        }
        await sound.seekTo(ms / 1000);
      },
      next: async () => step(1),
      prev: async () => {
        if (positionMs > 4000) {
          await soundRef.current?.seekTo(0);
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
