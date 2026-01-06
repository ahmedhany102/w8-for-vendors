
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { AuthUser } from '@/types/auth';
import { secureLogout } from './secureAuth';

export const clearSessionData = secureLogout;

export const fetchUserWithRetry = async (retries = 2, delayMs = 500): Promise<User | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt} to fetch user data`);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log(`❌ Attempt ${attempt} failed:`, error.message);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        return null;
      }
      
      if (user) {
        console.log(`✅ User data fetched successfully on attempt ${attempt}`);
        return user;
      }
    } catch (error) {
      console.error(`💥 Exception on attempt ${attempt}:`, error);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
    }
  }
  return null;
};

export const fetchUserProfile = async (userId: string, userEmail: string): Promise<AuthUser> => {
  try {
    console.log('📋 Fetching user profile for:', userId, userEmail);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Profile fetch error:', error);
      throw error;
    }

    // Check if user is banned
    if (profile?.status === 'banned') {
      console.warn('🚫 User is banned:', userEmail);
      toast.error('Your account has been banned. Please contact support.');
      throw new Error('Account banned');
    }

    // Fetch user role from secure user_roles table
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError);
    }

    // Determine user role based on their roles in user_roles table
    const isSuperAdmin = roles?.some(r => r.role === 'super_admin') || false;
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin') || false;
    const isVendor = roles?.some(r => r.role === 'vendor_admin') || false;

    // Determine the highest role
    const getUserRole = (): 'SUPER_ADMIN' | 'ADMIN' | 'VENDOR' | 'USER' => {
      if (isSuperAdmin) return 'SUPER_ADMIN';
      if (isAdmin) return 'ADMIN';
      if (isVendor) return 'VENDOR';
      return 'USER';
    };

    const userRole = getUserRole();

    if (!profile) {
      console.log('👤 Creating new profile for user:', userEmail);
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          name: userEmail?.split('@')[0] || 'User',
          role: userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' ? 'ADMIN' : userRole === 'VENDOR' ? 'VENDOR' : 'USER',
          is_admin: isAdmin,
          is_super_admin: isSuperAdmin,
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create profile:', insertError);
        throw insertError;
      }
      
      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        role: userRole,
        displayName: newProfile.name
      };
    } else {
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: userRole,
        displayName: profile.name
      };
    }
  } catch (error) {
    console.error('💥 Error in fetchUserProfile:', error);
    throw error;
  }
};
