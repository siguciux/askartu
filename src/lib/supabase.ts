import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { isBackendConfigured, SUPABASE_KEY, SUPABASE_URL } from './config';

let client: SupabaseClient | null = null;

/** Vienas Supabase klientas visai programėlei. Sesija saugoma telefone. */
export function getSupabase(): SupabaseClient {
  if (!isBackendConfigured) {
    throw new Error('Ryšys su serveriu dar nenustatytas.');
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });

    if (Platform.OS !== 'web') {
      // Sesiją atnaujiname tik kai programėlė atidaryta.
      AppState.addEventListener('change', (state) => {
        if (state === 'active') client?.auth.startAutoRefresh();
        else client?.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}
