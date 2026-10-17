import { useRef, type Dispatch, type SetStateAction } from 'react';

import { api } from './api';
import type { Track } from './types';

/**
 * Like or unlike a track inside a list without opening it. The heart flips at once; if the
 * request fails the list goes back to how it was and `onError` gets the message. A second tap
 * on the same track is ignored while its request is still in flight.
 */
export function useLikeToggle(
  setTracks: Dispatch<SetStateAction<Track[]>>,
  { onDone, onError }: { onDone?: () => void; onError?: (message: string | null) => void } = {}
) {
  const busy = useRef(new Set<string>());

  return async (track: Track) => {
    if (busy.current.has(track.id)) return;
    busy.current.add(track.id);
    const liked = !track.liked;
    const patch = (next: boolean) =>
      setTracks((list) =>
        list.map((item) =>
          item.id === track.id
            ? { ...item, liked: next, likeCount: Math.max(0, item.likeCount + (next === item.liked ? 0 : next ? 1 : -1)) }
            : item
        )
      );
    onError?.(null);
    patch(liked);
    try {
      if (liked) await api.like(track.id);
      else await api.unlike(track.id);
      onDone?.();
    } catch (err) {
      patch(!liked);
      onError?.(err instanceof Error && err.message ? err.message : null);
    } finally {
      busy.current.delete(track.id);
    }
  };
}
