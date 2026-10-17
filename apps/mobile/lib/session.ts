import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Kept under the old prefix like the app's other keys, so nothing saved earlier is orphaned.
const KEY = 'aimusik.session.token';

let cached: string | null | undefined;

function webStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The signed-in listener's API token, or null. Read once, then served from memory. */
export async function getSessionToken(): Promise<string | null> {
  if (cached !== undefined) return cached;
  try {
    cached = Platform.OS === 'web' ? webStorage()?.getItem(KEY) ?? null : await SecureStore.getItemAsync(KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export async function setSessionToken(token: string | null) {
  cached = token;
  try {
    if (Platform.OS === 'web') {
      if (token) webStorage()?.setItem(KEY, token);
      else webStorage()?.removeItem(KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(KEY, token);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Storage refused: the session still works until the app closes.
  }
}
