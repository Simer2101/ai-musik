import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { Track } from '@/lib/types';

type PlayerContextValue = {
  track: Track | null;
  queue: Track[];
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  play: (track: Track, queue?: Track[]) => Promise<void>;
  toggle: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  next: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

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

  const load = async (next: Track) => {
    if (!next.audioUrl) throw new Error('This track is not ready yet');
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: next.audioUrl },
      { shouldPlay: true, progressUpdateIntervalMillis: 400 },
      (status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        setPositionMs(status.positionMillis);
        setDurationMs(status.durationMillis ?? next.durationMs);
        if (status.didJustFinish) {
          void playAdjacent(1);
        }
      }
    );
    soundRef.current = sound;
    setTrack(next);
    setIsPlaying(true);
  };

  const playAdjacent = async (step: number) => {
    setQueue((currentQueue) => {
      const index = currentQueue.findIndex((item) => item.id === track?.id);
      const nextTrack = currentQueue[index + step];
      if (nextTrack) {
        void load(nextTrack);
      } else {
        setIsPlaying(false);
      }
      return currentQueue;
    });
  };

  const value = useMemo<PlayerContextValue>(
    () => ({
      track,
      queue,
      isPlaying,
      positionMs,
      durationMs,
      play: async (next, nextQueue) => {
        if (nextQueue) setQueue(nextQueue.filter((item) => item.status === 'ready' && item.audioUrl));
        await load(next);
      },
      toggle: async () => {
        if (!soundRef.current) return;
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) return;
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
        } else {
          await soundRef.current.playAsync();
        }
      },
      seek: async (ms) => {
        await soundRef.current?.setPositionAsync(ms);
      },
      next: async () => playAdjacent(1),
    }),
    [durationMs, isPlaying, positionMs, queue, track]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
