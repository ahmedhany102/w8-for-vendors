import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'banned';

/**
 * Assign a role to a user (super_admin can assign admin, admins can assign user)
 */
export const assignUserRole = async (
  targetUserId: string,
  newRole: UserRole
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('assign_user_role', {
      target_user_id: targetUserId,
      new_role: newRole
    });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error assigning user role:', error);
    toast.error(error.message || 'Failed to assign role');
    return false;
  }
};

/**
 * Update user status (ban/unban)
 */
export const updateUserStatus = async (
  targetUserId: string,
  newStatus: UserStatus
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('update_user_status', {
      target_user_id: targetUserId,
      new_status: newStatus
    });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error updating user status:', error);
    toast.error(error.message || 'Failed to update user status');
    return false;
  }
};

/**
 * Delete a user account (with permission checks)
 */
export const deleteUserAccount = async (targetUserId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('delete_user_account', {
      target_user_id: targetUserId
    });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    toast.error(error.message || 'Failed to delete user account');
    return false;
  }
};

/**
 * Get user's role from user_roles table
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const { data, error } = await supabase.rpc('get_user_highest_role', {
      _user_id: userId
    });

    if (error) throw error;
    return (data as UserRole) || 'user';
  } catch (error: any) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

/**
 * Check if a user can authenticate (not banned)
 */
export const canUserAuthenticate = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_user_authenticate', {
      _user_id: userId
    });

    if (error) throw error;
    return data || false;
  } catch (error: any) {
    console.error('Error checking auth status:', error);
    return false;
  }
};