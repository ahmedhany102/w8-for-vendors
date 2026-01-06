import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import type { AuthUser } from '@/types/auth';
import { fetchUserProfile } from '@/utils/authUtils';

export const useAuthValidation = () => {
  const [loading, setLoading] = useState(true);
  const validationInProgress = useRef(false);

  const validateSessionAndUser = async (
    setSession: (session: Session | null) => void,
    setUser: (user: AuthUser | null) => void
  ) => {
    // Prevent concurrent validation calls
    if (validationInProgress.current) {
      console.log('⏳ Session validation already in progress, skipping...');
      return;
    }
    
    validationInProgress.current = true;
    
    try {
      console.log('🔍 Starting session validation...');
      setLoading(true);
      
      // Get session - no timeout, let Supabase handle its own timeouts
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session validation error:', sessionError);
        setSession(null);
        setUser(null);
        setLoading(false);
        validationInProgress.current = false;
        return;
      }

      if (!currentSession || !currentSession.user) {
        console.log('🔍 No valid session found - user not logged in');
        setSession(null);
        setUser(null);
        setLoading(false);
        validationInProgress.current = false;
        return;
      }

      // Check if user is banned
      console.log('🔍 Checking ban status...');
      const { data: canAuth, error: authCheckError } = await supabase.rpc('can_user_authenticate', {
        _user_id: currentSession.user.id
      });

      if (authCheckError) {
        console.error('❌ Auth check error:', authCheckError);
        // Don't block login for RPC errors, just log them
      }

      if (canAuth === false) {
        console.warn('🚫 User is banned, signing out:', currentSession.user.email);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        validationInProgress.current = false;
        toast.error('تم حظر حسابك. تم تسجيل الخروج تلقائياً');
        return;
      }

      console.log('✅ Valid session found, loading profile...');
      setSession(currentSession);

      try {
        const userData = await fetchUserProfile(currentSession.user.id, currentSession.user.email!);
        console.log('✅ User profile loaded:', userData.email, userData.role);
        setUser(userData);
      } catch (profileError) {
        console.error('❌ Failed to load user profile:', profileError);
        // Create fallback user data - don't log out
        const basicUserData: AuthUser = {
          id: currentSession.user.id,
          email: currentSession.user.email!,
          name: currentSession.user.email?.split('@')[0] || 'User',
          role: 'USER'
        };
        console.log('⚠️ Using fallback user data');
        setUser(basicUserData);
      }
      
    } catch (error) {
      console.error('💥 Critical auth validation exception:', error);
      // Don't clear session on errors - let user retry
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
      validationInProgress.current = false;
      console.log('🔧 Auth validation completed');
    }
  };

  return { validateSessionAndUser, loading, setLoading };
};
