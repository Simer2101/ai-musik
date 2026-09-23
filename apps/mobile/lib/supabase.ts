import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const memoryStore = new Map<string, string>();

const store = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return memoryStore.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      memoryStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      memoryStore.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {
    storage: store,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
