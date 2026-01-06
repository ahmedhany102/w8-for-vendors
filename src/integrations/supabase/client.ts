
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Safe localStorage wrapper to handle corruption
const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('⚠️ localStorage error, clearing corrupted data:', e);
      try {
        localStorage.clear();
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('⚠️ Failed to save to localStorage:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('⚠️ Failed to remove from localStorage:', e);
    }
  }
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: safeLocalStorage
  }
});

// Safe auth state monitoring - trust SDK's persistence
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔔 Supabase Auth Event:', event);
  console.log('🔑 Session exists:', !!session);
  
  if (session) {
    console.log('👤 User:', session.user.email);
    console.log('🕒 Session expires at:', new Date(session.expires_at! * 1000));
    console.log('🔄 Auto-refresh enabled');
  }
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Session token automatically refreshed');
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('🧹 User signed out');
  }
});
