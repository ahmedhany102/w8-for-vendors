import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import type { AuthUser, AuthContextType } from '@/types/auth';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import { fetchUserProfile } from '@/utils/authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const isInitialized = useRef(false);
  const lastFocusCheck = useRef<number>(0);

  // هنا بنستخدم setLoading من الـ hook عشان نتحكم في حالة التحميل المركزية
  const { validateSessionAndUser, loading, setLoading } = useAuthValidation();
  const { login: baseLogin, adminLogin: baseAdminLogin, signup: baseSignup, logout: baseLogout } = useAuthOperations();

  const checkAuthStatus = useCallback(async () => {
    await validateSessionAndUser(setSession, setUser);
  }, [validateSessionAndUser]);

  // Handle tab focus/visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFocusCheck.current < 5000) return;
        lastFocusCheck.current = now;

        console.log('👁️ Tab became visible, checking session...');
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) return;

          if (currentSession && currentSession.user) {
            if (!session || session.access_token !== currentSession.access_token) {
              console.log('🔄 Refreshing session state after tab focus');
              setSession(currentSession);
              // Background refresh is fine here because the user is ALREADY logged in/viewing the page
              try {
                const userData = await fetchUserProfile(currentSession.user.id, currentSession.user.email!);
                setUser(userData);
              } catch (err) {
                console.warn('⚠️ Could not refresh profile on focus:', err);
              }
            }
          } else if (session) {
            console.log('🚪 Session expired while tab was hidden');
            setSession(null);
            setUser(null);
          }
        } catch (err) {
          console.error('❌ Error during focus check:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('🚀 Initializing auth system...');

    // 1. Setup Listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 Auth state changed:', event);

        // --- حالة الخروج ---
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        // --- حالة الدخول ---
        // Note: For login, we handle state updates imperatively in the login function
        // This listener is mainly for token refresh and initial load scenarios
        if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          console.log('🔄 Token refreshed, updating session...');
          setSession(newSession);

          // Refresh user profile on token refresh
          try {
            const userData = await fetchUserProfile(newSession.user.id, newSession.user.email!);
            setUser(userData);
            console.log('✅ Profile refreshed successfully:', userData.role);
          } catch (err) {
            console.warn('⚠️ Could not refresh profile on token refresh:', err);
          }
        } else if (event === 'USER_UPDATED') {
          setSession(newSession);
        }
      }
    );

    // 2. Initial Load
    const initializeAuth = async () => {
      try {
        await validateSessionAndUser(setSession, setUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to run once

  // Imperative login function that manually fetches and updates state after successful auth
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);

    try {
      // 1. Attempt Supabase login
      const success = await baseLogin(email, password);
      if (!success) {
        setLoading(false);
        return false;
      }

      // 2. Immediately fetch session manually (don't wait for onAuthStateChange)
      console.log('🔐 Login successful, fetching session manually...');
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !newSession || !newSession.user) {
        console.error('❌ Failed to get session after login:', sessionError);
        setLoading(false);
        return false;
      }

      // 3. Check if user is banned
      const { data: canAuth } = await supabase.rpc('can_user_authenticate', {
        _user_id: newSession.user.id
      });

      if (canAuth === false) {
        console.warn('🚫 Banned user detected');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setLoading(false);
        toast.error('تم حظر حسابك. تم تسجيل الخروج تلقائياً');
        return false;
      }

      // 4. Fetch user profile
      const userData = await fetchUserProfile(newSession.user.id, newSession.user.email!);

      // 5. Update state imperatively
      setSession(newSession);
      setUser(userData);
      setLoading(false);

      console.log('✅ Login complete, user state updated:', userData.role);
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      return false;
    }
  }, [baseLogin, setLoading]);

  // Imperative adminLogin function that manually fetches and updates state after successful auth
  const adminLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);

    try {
      // 1. Attempt Supabase admin login
      const success = await baseAdminLogin(email, password);
      if (!success) {
        setLoading(false);
        return false;
      }

      // 2. Immediately fetch session manually (don't wait for onAuthStateChange)
      console.log('👑 Admin login successful, fetching session manually...');
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !newSession || !newSession.user) {
        console.error('❌ Failed to get session after admin login:', sessionError);
        setLoading(false);
        return false;
      }

      // 3. Check if user is banned
      const { data: canAuth } = await supabase.rpc('can_user_authenticate', {
        _user_id: newSession.user.id
      });

      if (canAuth === false) {
        console.warn('🚫 Banned user detected');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setLoading(false);
        toast.error('تم حظر حسابك. تم تسجيل الخروج تلقائياً');
        return false;
      }

      // 4. Fetch user profile
      const userData = await fetchUserProfile(newSession.user.id, newSession.user.email!);

      // 5. Update state imperatively
      setSession(newSession);
      setUser(userData);
      setLoading(false);

      console.log('✅ Admin login complete, user state updated:', userData.role);
      return true;
    } catch (error) {
      console.error('❌ Admin login error:', error);
      setLoading(false);
      return false;
    }
  }, [baseAdminLogin, setLoading]);

  // Imperative signup function that manually fetches and updates state after successful signup
  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setLoading(true);

    try {
      // 1. Attempt Supabase signup
      const success = await baseSignup(email, password, name);
      if (!success) {
        setLoading(false);
        return false;
      }

      // 2. Immediately fetch session manually (don't wait for onAuthStateChange)
      console.log('📝 Signup successful, fetching session manually...');
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !newSession || !newSession.user) {
        // This is expected if email confirmation is required
        console.log('ℹ️ No session after signup - email confirmation may be required');
        setLoading(false);
        return true; // Signup was successful, just no auto-login
      }

      // 3. Check if user is banned
      const { data: canAuth } = await supabase.rpc('can_user_authenticate', {
        _user_id: newSession.user.id
      });

      if (canAuth === false) {
        console.warn('🚫 Banned user detected');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setLoading(false);
        toast.error('تم حظر حسابك. تم تسجيل الخروج تلقائياً');
        return false;
      }

      // 4. Fetch user profile
      try {
        const userData = await fetchUserProfile(newSession.user.id, newSession.user.email!);

        // 5. Update state imperatively
        setSession(newSession);
        setUser(userData);
        setLoading(false);

        console.log('✅ Signup complete, user state updated:', userData.role);
      } catch (profileError) {
        console.warn('⚠️ Could not fetch profile after signup:', profileError);
        // Still set the session even if profile fetch fails
        setSession(newSession);
        setLoading(false);
      }

      return true;
    } catch (error) {
      console.error('❌ Signup error:', error);
      setLoading(false);
      return false;
    }
  }, [baseSignup, setLoading]);

  // Imperative logout function that manually clears state after logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await baseLogout();

      // Immediately clear state (don't wait for onAuthStateChange)
      setUser(null);
      setSession(null);
      console.log('✅ Logout complete, state cleared');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force clear state on error anyway
      setUser(null);
      setSession(null);
    }
  }, [baseLogout]);

  const contextValue: AuthContextType = {
    user,
    session,
    login,
    adminLogin,
    signup,
    logout,
    loading,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isVendor: user?.role === 'VENDOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};