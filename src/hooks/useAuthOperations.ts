
import { supabase } from '@/integrations/supabase/client';
import { secureLogin, secureSignup, secureLogout, checkAdminStatus } from '@/utils/secureAuth';
import { createSanitizedUserSchema } from '@/utils/sanitization';
import { toastManager } from '@/utils/toastManager';

export const useAuthOperations = () => {
  const login = async (email: string, password: string): Promise<boolean> => {
    // Validate and sanitize input
    try {
      const schema = createSanitizedUserSchema().pick({ email: true });
      const sanitizedData = schema.parse({ email });
      return await secureLogin(sanitizedData.email, password);
    } catch (error: any) {
      toastManager.error('Invalid email format');
      return false;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    console.log('👑 Admin login attempt for:', email);
    
    // First attempt normal login
    const loginSuccess = await login(email, password);
    if (!loginSuccess) {
      return false;
    }

    // Then verify admin status from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toastManager.error('Authentication failed');
        return false;
      }

      const isAdmin = await checkAdminStatus(user.id);
      if (!isAdmin) {
        toastManager.error('Access denied: Admin privileges required');
        await secureLogout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Admin verification failed:', error);
      toastManager.error('Admin verification failed');
      await secureLogout();
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    // Validate and sanitize input
    try {
      const schema = createSanitizedUserSchema();
      const sanitizedData = schema.parse({ email, password, name });
      return await secureSignup(sanitizedData.email, sanitizedData.password, sanitizedData.name);
    } catch (error: any) {
      const message = error.errors?.[0]?.message || 'Invalid input data';
      toastManager.error(message);
      return false;
    }
  };

  const logout = secureLogout;

  return { login, adminLogin, signup, logout };
};
