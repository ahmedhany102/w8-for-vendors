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

  const { validateSessionAndUser, loading, setLoading } = useAuthValidation();
  const { login, adminLogin, signup, logout } = useAuthOperations();

  const checkAuthStatus = useCallback(async () => {
    await validateSessionAndUser(setSession, setUser);
  }, [validateSessionAndUser]);

  // Handle tab focus/visibility changes - refresh session when returning to app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Throttle focus checks to once per 5 seconds
        if (now - lastFocusCheck.current < 5000) {
          return;
        }
        lastFocusCheck.current = now;
        
        console.log('👁️ Tab became visible, checking session...');
        
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Error checking session on focus:', error);
            return;
          }
          
          if (currentSession && currentSession.user) {
            // Session is valid, update state if needed
            if (!session || session.access_token !== currentSession.access_token) {
              console.log('🔄 Refreshing session state after tab focus');
              setSession(currentSession);
              
              // Refresh user profile in background
              try {
                const userData = await fetchUserProfile(currentSession.user.id, currentSession.user.email!);
                setUser(userData);
              } catch (err) {
                console.warn('⚠️ Could not refresh profile on focus:', err);
              }
            }
          } else if (session) {
            // Had a session but it's now gone - user was logged out
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
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;
    
    console.log('🚀 Initializing auth system...');

    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 Auth state changed:', event, newSession?.user?.email || 'No user');

        // Handle SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        // Handle SIGNED_IN or TOKEN_REFRESHED
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          console.log('🔐 User signed in or token refreshed');

          // Check ban status (use setTimeout to avoid Supabase deadlock)
          setTimeout(async () => {
            try {
              const { data: canAuth } = await supabase.rpc('can_user_authenticate', {
                _user_id: newSession.user.id
              });

              if (canAuth === false) {
                console.warn('🚫 Banned user detected, signing out');
                await supabase.auth.signOut();
                setUser(null);
                setSession(null);
                setLoading(false);
                toast.error('تم حظر حسابك. تم تسجيل الخروج تلقائياً');
                return;
              }

              setSession(newSession);

              try {
                const userData = await fetchUserProfile(newSession.user.id, newSession.user.email!);
                setUser(userData);
                console.log('✅ Profile loaded:', userData.email, userData.role);
              } catch (err) {
                console.error('❌ Failed to load profile:', err);
                // Use fallback
                setUser({
                  id: newSession.user.id,
                  email: newSession.user.email!,
                  name: newSession.user.email?.split('@')[0] || 'User',
                  role: 'USER'
                });
              }
              setLoading(false);
            } catch (err) {
              console.error('❌ Error in auth state handler:', err);
              setLoading(false);
            }
          }, 0);
          return;
        }

        // Handle USER_UPDATED
        if (event === 'USER_UPDATED' && newSession?.user) {
          console.log('👤 User updated');
          setSession(newSession);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
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
  }, []);

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
