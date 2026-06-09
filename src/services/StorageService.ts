import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny typed wrapper around AsyncStorage. Centralises JSON parsing
 * and swallows the inevitable corruption / missing-key errors so the
 * callers stay readable.
 */
export const StorageService = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // best-effort - persistence failures should never crash playback
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
