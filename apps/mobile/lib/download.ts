import { Linking, Platform } from 'react-native';

import { trackTitle } from './cover';
import type { Track } from './types';

function fileName(track: Track) {
  const base = trackTitle(track).replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'Sonari';
  return `${base}.mp3`;
}

/** Saves the track's MP3. Callers must check Premium first: downloads are a Premium perk. */
export async function downloadTrack(track: Track) {
  if (!track.audioUrl) throw new Error('No audio');
  if (Platform.OS !== 'web') {
    // Phones hand the file to the system browser, which offers to save it.
    await Linking.openURL(track.audioUrl);
    return;
  }
  try {
    const response = await fetch(track.audioUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName(track);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    // The audio host may not allow cross-site reads; open the file so the browser can save it.
    window.open(track.audioUrl, '_blank', 'noopener');
  }
}
